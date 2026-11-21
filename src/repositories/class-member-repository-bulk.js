// src/repositories/class-member-repository-bulk.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_MEMBER_HEADERS } from "@/config/class-member-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

import { SPREADSHEET_ID } from "./class-member-repository-constants";
import { getClassMembersData } from "./class-member-repository-data";
import { executeBulkBatch, getRequiredSheetIds, toRowData } from "./class-member-repository-infrastructure";
import { createBulkResult, createMembershipAuditData, createMembershipRow, getMembershipSnapshot } from "./class-member-repository-mappers";
import { assertNoMembershipOverlap, assertValidMembershipData, getActiveMemberships, getPreviousDate, isValidDate, validateBulkStudentIds } from "./class-member-repository-validation";

function getBulkValidationSkipReason(error) {
  const allowedErrors = new Set(["STUDENT_MEMBERSHIP_DATE_OVERLAP", "INVALID_CLASS_MEMBER_DATA", "INVALID_EFFECTIVE_FROM", "INVALID_EFFECTIVE_TO", "INVALID_MEMBERSHIP_DATE_RANGE"]);

  if (allowedErrors.has(error?.message)) {
    return error.message;
  }

  throw error;
}

/**
 * Menambahkan banyak siswa ke satu kelas.
 */
export async function createClassMembershipsBulk(studentIds, classId, effectiveDate, auditData) {
  const normalizedIds = validateBulkStudentIds(studentIds);
  const normalizedClassId = String(classId || "").trim();
  const normalizedDate = String(effectiveDate || "").trim();

  if (!normalizedClassId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  if (!isValidDate(normalizedDate)) {
    throw new Error("INVALID_EFFECTIVE_DATE");
  }

  const memberships = await getClassMembersData();

  const processed = [];
  const skipped = [];
  const newMemberships = [];
  const auditRows = [];

  const now = new Date().toISOString();

  for (const studentId of normalizedIds) {
    const activeMemberships = getActiveMemberships(memberships, studentId, normalizedDate);

    if (activeMemberships.length > 1) {
      skipped.push({
        student_id: studentId,
        reason: "DATA_KEANGGOTAAN_TIDAK_KONSISTEN",
      });
      continue;
    }

    if (activeMemberships.length === 1) {
      const current = activeMemberships[0];

      skipped.push({
        student_id: studentId,
        reason: current.class_id === normalizedClassId ? "SUDAH_MENJADI_ANGGOTA_KELAS_TUJUAN" : "SUDAH_MEMILIKI_KEANGGOTAAN_KELAS_LAIN",
        current_class_id: current.class_id,
      });

      continue;
    }

    let membershipData;

    try {
      membershipData = assertValidMembershipData({
        student_id: studentId,
        class_id: normalizedClassId,
        effective_from: normalizedDate,
        effective_to: "",
      });

      assertNoMembershipOverlap(memberships, studentId, normalizedDate, "");
    } catch (error) {
      skipped.push({
        student_id: studentId,
        reason: getBulkValidationSkipReason(error),
      });

      continue;
    }

    const membershipId = randomUUID();

    const membership = {
      membership_id: membershipId,
      ...membershipData,
      created_at: now,
      updated_at: now,
    };

    const auditRow = await prepareAdministrativeAudit(createMembershipAuditData(auditData, "CREATE", membershipId, null, membership, "Penambahan siswa ke kelas secara massal"));

    newMemberships.push(membership);
    auditRows.push(auditRow);

    processed.push({
      student_id: studentId,
      membership_id: membershipId,
      class_id: normalizedClassId,
    });
  }

  if (newMemberships.length > 0) {
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
    }

    const sheets = await getGoogleSheetsClient();

    const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

    await executeBulkBatch([
      {
        appendCells: {
          sheetId: membersSheetId,
          rows: newMemberships.map((membership) => toRowData(createMembershipRow(membership))),
          fields: "userEnteredValue",
        },
      },
      {
        appendCells: {
          sheetId: auditSheetId,
          rows: auditRows.map(toRowData),
          fields: "userEnteredValue",
        },
      },
    ]);
  }

  return createBulkResult(processed, skipped);
}

/**
 * Memindahkan banyak siswa ke satu kelas tujuan.
 */
export async function moveClassMembershipsBulk(studentIds, newClassId, effectiveDate, auditData) {
  const normalizedIds = validateBulkStudentIds(studentIds);
  const normalizedClassId = String(newClassId || "").trim();
  const normalizedDate = String(effectiveDate || "").trim();

  if (!normalizedClassId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  if (!isValidDate(normalizedDate)) {
    throw new Error("INVALID_EFFECTIVE_DATE");
  }

  const memberships = await getClassMembersData();

  const processed = [];
  const skipped = [];
  const updateRequests = [];
  const newMembershipRows = [];
  const auditRows = [];

  const now = new Date().toISOString();

  for (const studentId of normalizedIds) {
    const activeMemberships = getActiveMemberships(memberships, studentId, normalizedDate);

    if (activeMemberships.length === 0) {
      skipped.push({
        student_id: studentId,
        reason: "TIDAK_MEMILIKI_KEANGGOTAAN_KELAS_AKTIF",
      });
      continue;
    }

    if (activeMemberships.length > 1) {
      skipped.push({
        student_id: studentId,
        reason: "DATA_KEANGGOTAAN_TIDAK_KONSISTEN",
      });
      continue;
    }

    const current = activeMemberships[0];

    if (current.class_id === normalizedClassId) {
      skipped.push({
        student_id: studentId,
        reason: "SUDAH_MENJADI_ANGGOTA_KELAS_TUJUAN",
        current_class_id: current.class_id,
      });
      continue;
    }

    if (normalizedDate <= current.effective_from) {
      skipped.push({
        student_id: studentId,
        reason: "TANGGAL_PEMINDAHAN_TIDAK_VALID",
      });
      continue;
    }

    const previousEnd = getPreviousDate(normalizedDate);

    let newMembershipData;

    try {
      newMembershipData = assertValidMembershipData({
        student_id: studentId,
        class_id: normalizedClassId,
        effective_from: normalizedDate,
        effective_to: "",
      });

      assertNoMembershipOverlap(memberships, studentId, normalizedDate, "", current.membership_id);
    } catch (error) {
      skipped.push({
        student_id: studentId,
        reason: getBulkValidationSkipReason(error),
      });

      continue;
    }

    const newMembershipId = randomUUID();

    const oldData = getMembershipSnapshot(current);

    const newMembership = {
      membership_id: newMembershipId,
      ...newMembershipData,
      created_at: now,
      updated_at: now,
    };

    const updatedOldRow = [current.membership_id, current.student_id, current.class_id, current.effective_from, previousEnd, current.created_at, now];

    updateRequests.push({
      updateCells: {
        range: {
          sheetId: null,
          startRowIndex: current.row_number - 1,
          endRowIndex: current.row_number,
          startColumnIndex: 0,
          endColumnIndex: CLASS_MEMBER_HEADERS.length,
        },
        rows: [toRowData(updatedOldRow)],
        fields: "userEnteredValue",
      },
    });

    const oldAuditRow = await prepareAdministrativeAudit(
      createMembershipAuditData(
        auditData,
        "UPDATE",
        current.membership_id,
        oldData,
        {
          ...oldData,
          effective_to: previousEnd,
          updated_at: now,
        },
        "Perpindahan kelas secara massal",
      ),
    );

    const newAuditRow = await prepareAdministrativeAudit(createMembershipAuditData(auditData, "CREATE", newMembershipId, null, newMembership, "Perpindahan kelas secara massal"));

    auditRows.push(oldAuditRow, newAuditRow);
    newMembershipRows.push(newMembership);

    processed.push({
      student_id: studentId,
      previous_class_id: current.class_id,
      new_class_id: normalizedClassId,
      previous_membership_id: current.membership_id,
      new_membership_id: newMembershipId,
    });
  }

  if (processed.length > 0) {
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
    }

    const sheets = await getGoogleSheetsClient();

    const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

    const requests = updateRequests.map((request) => ({
      updateCells: {
        ...request.updateCells,
        range: {
          ...request.updateCells.range,
          sheetId: membersSheetId,
        },
      },
    }));

    requests.push({
      appendCells: {
        sheetId: membersSheetId,
        rows: newMembershipRows.map((membership) => toRowData(createMembershipRow(membership))),
        fields: "userEnteredValue",
      },
    });

    requests.push({
      appendCells: {
        sheetId: auditSheetId,
        rows: auditRows.map(toRowData),
        fields: "userEnteredValue",
      },
    });

    await executeBulkBatch(requests);
  }

  return createBulkResult(processed, skipped);
}

/**
 * Mengakhiri keanggotaan kelas banyak siswa.
 */
export async function endClassMembershipsBulk(studentIds, effectiveDate, auditData) {
  const normalizedIds = validateBulkStudentIds(studentIds);
  const normalizedDate = String(effectiveDate || "").trim();

  if (!isValidDate(normalizedDate)) {
    throw new Error("INVALID_EFFECTIVE_DATE");
  }

  const memberships = await getClassMembersData();

  const processed = [];
  const skipped = [];
  const updateRequests = [];
  const deletionIndexes = [];
  const auditRows = [];

  const now = new Date().toISOString();

  for (const studentId of normalizedIds) {
    const activeMemberships = getActiveMemberships(memberships, studentId, normalizedDate);

    if (activeMemberships.length === 0) {
      skipped.push({
        student_id: studentId,
        reason: "TIDAK_MEMILIKI_KEANGGOTAAN_KELAS_AKTIF",
      });
      continue;
    }

    if (activeMemberships.length > 1) {
      skipped.push({
        student_id: studentId,
        reason: "DATA_KEANGGOTAAN_TIDAK_KONSISTEN",
      });
      continue;
    }

    const current = activeMemberships[0];
    const oldData = getMembershipSnapshot(current);

    if (current.effective_from === normalizedDate) {
      const auditRow = await prepareAdministrativeAudit(createMembershipAuditData(auditData, "DELETE", current.membership_id, oldData, null, "Pembatalan keanggotaan kelas secara massal"));

      auditRows.push(auditRow);
      deletionIndexes.push(current.row_number - 1);

      processed.push({
        student_id: studentId,
        membership_id: current.membership_id,
        operation: "DELETE",
      });

      continue;
    }

    const updatedRow = [current.membership_id, current.student_id, current.class_id, current.effective_from, normalizedDate, current.created_at, now];

    updateRequests.push({
      row_index: current.row_number - 1,
      row: toRowData(updatedRow),
    });

    const auditRow = await prepareAdministrativeAudit(
      createMembershipAuditData(
        auditData,
        "UPDATE",
        current.membership_id,
        oldData,
        {
          ...oldData,
          effective_to: normalizedDate,
          updated_at: now,
        },
        "Pengakhiran keanggotaan kelas secara massal",
      ),
    );

    auditRows.push(auditRow);

    processed.push({
      student_id: studentId,
      membership_id: current.membership_id,
      operation: "UPDATE",
      effective_to: normalizedDate,
    });
  }

  if (processed.length > 0) {
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
    }

    const sheets = await getGoogleSheetsClient();

    const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

    const requests = updateRequests.map((item) => ({
      updateCells: {
        range: {
          sheetId: membersSheetId,
          startRowIndex: item.row_index,
          endRowIndex: item.row_index + 1,
          startColumnIndex: 0,
          endColumnIndex: CLASS_MEMBER_HEADERS.length,
        },
        rows: [item.row],
        fields: "userEnteredValue",
      },
    }));

    deletionIndexes.sort((a, b) => b - a);

    for (const rowIndex of deletionIndexes) {
      requests.push({
        deleteDimension: {
          range: {
            sheetId: membersSheetId,
            dimension: "ROWS",
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      });
    }

    if (auditRows.length > 0) {
      requests.push({
        appendCells: {
          sheetId: auditSheetId,
          rows: auditRows.map(toRowData),
          fields: "userEnteredValue",
        },
      });
    }

    await executeBulkBatch(requests);
  }

  return createBulkResult(processed, skipped);
}
