// src/repositories/class-member-repository.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_MEMBER_HEADERS } from "@/config/class-member-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Class_Members";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

async function getClassMembersData() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (headers.length !== CLASS_MEMBER_HEADERS.length || !CLASS_MEMBER_HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("INVALID_CLASS_MEMBERS_HEADERS");
  }

  return rows.slice(1).map((row, index) => ({
    membership_id: row[0] || "",
    student_id: row[1] || "",
    class_id: row[2] || "",
    effective_from: row[3] || "",
    effective_to: row[4] || "",
    created_at: row[5] || "",
    updated_at: row[6] || "",
    row_number: index + 2,
  }));
}

async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const membersSheet = properties.find((sheet) => sheet.properties.title === SHEET_NAME);

  const auditSheet = properties.find((sheet) => sheet.properties.title === AUDIT_SHEET_NAME);

  if (!membersSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    membersSheetId: membersSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

function toCellData(value) {
  return {
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  };
}

function toRowData(values) {
  return {
    values: values.map(toCellData),
  };
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function assertValidMembershipData(data) {
  const studentId = String(data?.student_id || "").trim();
  const classId = String(data?.class_id || "").trim();
  const effectiveFrom = String(data?.effective_from || "").trim();
  const effectiveTo = String(data?.effective_to || "").trim();

  if (!studentId || !classId) {
    throw new Error("INVALID_CLASS_MEMBER_DATA");
  }

  if (!isValidDate(effectiveFrom)) {
    throw new Error("INVALID_EFFECTIVE_FROM");
  }

  if (effectiveTo && !isValidDate(effectiveTo)) {
    throw new Error("INVALID_EFFECTIVE_TO");
  }

  if (effectiveTo && effectiveTo < effectiveFrom) {
    throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
  }

  return {
    student_id: studentId,
    class_id: classId,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
  };
}

function hasDateOverlap(startA, endA, startB, endB) {
  const normalizedEndA = endA || "9999-12-31";
  const normalizedEndB = endB || "9999-12-31";

  return startA <= normalizedEndB && startB <= normalizedEndA;
}

function assertNoMembershipOverlap(memberships, studentId, effectiveFrom, effectiveTo, excludeMembershipId = null) {
  const overlap = memberships.some((membership) => {
    if (membership.student_id !== studentId) {
      return false;
    }

    if (membership.membership_id === excludeMembershipId) {
      return false;
    }

    return hasDateOverlap(effectiveFrom, effectiveTo, membership.effective_from, membership.effective_to);
  });

  if (overlap) {
    throw new Error("STUDENT_MEMBERSHIP_DATE_OVERLAP");
  }
}

function getPreviousDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

function getActiveMemberships(memberships, studentId, date) {
  return memberships.filter((membership) => membership.student_id === studentId && membership.effective_from <= date && (!membership.effective_to || membership.effective_to >= date));
}

function validateBulkStudentIds(studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error("STUDENT_IDS_REQUIRED");
  }

  const normalizedIds = studentIds.map((id) => String(id || "").trim());

  if (normalizedIds.some((id) => !id)) {
    throw new Error("INVALID_STUDENT_ID");
  }

  if (new Set(normalizedIds).size !== normalizedIds.length) {
    throw new Error("DUPLICATE_STUDENT_IDS");
  }

  return normalizedIds;
}

function createBulkResult(processed, skipped) {
  return {
    processed,
    skipped,
    processed_count: processed.length,
    skipped_count: skipped.length,
  };
}

function createMembershipAuditData(auditData, actionType, membershipId, oldData, newData, reason) {
  return {
    ...auditData,
    action_type: actionType,
    table_name: SHEET_NAME,
    record_id: membershipId,
    reason: auditData?.reason || reason,
    old_data: oldData,
    new_data: newData,
  };
}

function createMembershipRow(membership) {
  return [membership.membership_id, membership.student_id, membership.class_id, membership.effective_from, membership.effective_to, membership.created_at, membership.updated_at];
}

function getMembershipSnapshot(membership) {
  return {
    membership_id: membership.membership_id,
    student_id: membership.student_id,
    class_id: membership.class_id,
    effective_from: membership.effective_from,
    effective_to: membership.effective_to,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
}

async function executeBulkBatch(requests) {
  if (requests.length === 0) {
    return;
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });
}

export async function getAllClassMembers() {
  return getClassMembersData();
}

export async function getClassMemberById(membershipId) {
  if (!membershipId) {
    throw new Error("MEMBERSHIP_ID_REQUIRED");
  }

  const memberships = await getClassMembersData();

  return memberships.find((membership) => membership.membership_id === membershipId) || null;
}

export async function getClassMembersByStudentId(studentId) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  const memberships = await getClassMembersData();

  return memberships.filter((membership) => membership.student_id === studentId);
}

export async function getActiveClassMembershipByStudentId(studentId, date) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  if (!isValidDate(date)) {
    throw new Error("INVALID_MEMBERSHIP_CHECK_DATE");
  }

  const memberships = await getClassMembersData();

  return getActiveMemberships(memberships, studentId, date)[0] || null;
}

/**
 * Menyiapkan penutupan seluruh keanggotaan kelas aktif siswa.
 *
 * Fungsi ini tidak menjalankan batchUpdate.
 */
export async function prepareEndStudentClassMemberships(studentId, effectiveDate, auditData) {
  const normalizedStudentId = String(studentId || "").trim();
  const normalizedDate = String(effectiveDate || "").trim();

  if (!normalizedStudentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  if (!isValidDate(normalizedDate)) {
    throw new Error("INVALID_EFFECTIVE_DATE");
  }

  const memberships = await getClassMembersData();

  const affectedMemberships = getActiveMemberships(memberships, normalizedStudentId, normalizedDate);

  if (affectedMemberships.length === 0) {
    return {
      requests: [],
      closed_memberships: [],
      removed_memberships: [],
    };
  }

  const sheets = await getGoogleSheetsClient();

  const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();

  const requests = [];
  const auditRows = [];

  const closedMemberships = [];
  const removedMemberships = [];
  const deletionIndexes = [];

  for (const membership of affectedMemberships) {
    const oldData = getMembershipSnapshot(membership);

    if (membership.effective_from === normalizedDate) {
      const auditRow = await prepareAdministrativeAudit(
        createMembershipAuditData(auditData, "DELETE", membership.membership_id, oldData, null, "Pembatalan keanggotaan karena perubahan status siswa"),
      );

      auditRows.push(auditRow);
      deletionIndexes.push(membership.row_number - 1);

      removedMemberships.push({
        membership_id: membership.membership_id,
        student_id: membership.student_id,
        class_id: membership.class_id,
        effective_from: membership.effective_from,
      });

      continue;
    }

    const effectiveTo = getPreviousDate(normalizedDate);

    if (effectiveTo < membership.effective_from) {
      throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
    }

    const updatedRow = [membership.membership_id, membership.student_id, membership.class_id, membership.effective_from, effectiveTo, membership.created_at, now];

    requests.push({
      updateCells: {
        range: {
          sheetId: membersSheetId,
          startRowIndex: membership.row_number - 1,
          endRowIndex: membership.row_number,
          startColumnIndex: 0,
          endColumnIndex: CLASS_MEMBER_HEADERS.length,
        },
        rows: [toRowData(updatedRow)],
        fields: "userEnteredValue",
      },
    });

    const auditRow = await prepareAdministrativeAudit(
      createMembershipAuditData(
        auditData,
        "UPDATE",
        membership.membership_id,
        oldData,
        {
          ...oldData,
          effective_to: effectiveTo,
          updated_at: now,
        },
        "Penutupan keanggotaan karena perubahan status siswa",
      ),
    );

    auditRows.push(auditRow);

    closedMemberships.push({
      membership_id: membership.membership_id,
      student_id: membership.student_id,
      class_id: membership.class_id,
      effective_from: membership.effective_from,
      effective_to: effectiveTo,
      updated_at: now,
    });
  }

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

  return {
    requests,
    closed_memberships: closedMemberships,
    removed_memberships: removedMemberships,
  };
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

    const membershipData = assertValidMembershipData({
      student_id: studentId,
      class_id: normalizedClassId,
      effective_from: normalizedDate,
      effective_to: "",
    });

    assertNoMembershipOverlap(memberships, studentId, normalizedDate, "");

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

    const newMembershipData = assertValidMembershipData({
      student_id: studentId,
      class_id: normalizedClassId,
      effective_from: normalizedDate,
      effective_to: "",
    });

    assertNoMembershipOverlap(memberships, studentId, normalizedDate, "", current.membership_id);

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

export async function createClassMembership(data, auditData) {
  const membershipData = assertValidMembershipData(data);

  const memberships = await getClassMembersData();

  assertNoMembershipOverlap(memberships, membershipData.student_id, membershipData.effective_from, membershipData.effective_to);

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const membershipId = randomUUID();

  const row = [membershipId, membershipData.student_id, membershipData.class_id, membershipData.effective_from, membershipData.effective_to, now, now];

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "CREATE",
    table_name: SHEET_NAME,
    record_id: membershipId,
    new_data: {
      membership_id: membershipId,
      ...membershipData,
      created_at: now,
      updated_at: now,
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: membersSheetId,
            rows: [toRowData(row)],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [toRowData(auditRow)],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    membership_id: membershipId,
    ...membershipData,
    created_at: now,
    updated_at: now,
  };
}

export async function endClassMembership(membershipId, effectiveTo, auditData) {
  if (!membershipId) {
    throw new Error("MEMBERSHIP_ID_REQUIRED");
  }

  const endDate = String(effectiveTo || "").trim();

  if (!isValidDate(endDate)) {
    throw new Error("INVALID_EFFECTIVE_TO");
  }

  const memberships = await getClassMembersData();

  const existing = memberships.find((membership) => membership.membership_id === membershipId);

  if (!existing) {
    throw new Error("CLASS_MEMBERSHIP_NOT_FOUND");
  }

  if (endDate < existing.effective_from) {
    throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
  }

  if (existing.effective_to && endDate > existing.effective_to) {
    throw new Error("MEMBERSHIP_END_DATE_EXCEEDS_EXISTING_RANGE");
  }

  if (existing.effective_to === endDate) {
    throw new Error("MEMBERSHIP_ALREADY_ENDED_ON_DATE");
  }

  if (existing.effective_to && existing.effective_to < endDate) {
    throw new Error("MEMBERSHIP_ALREADY_ENDED");
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();

  const updatedRow = [existing.membership_id, existing.student_id, existing.class_id, existing.effective_from, endDate, existing.created_at, now];

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "UPDATE",
    table_name: SHEET_NAME,
    record_id: membershipId,
    old_data: getMembershipSnapshot(existing),
    new_data: {
      ...getMembershipSnapshot(existing),
      effective_to: endDate,
      updated_at: now,
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: membersSheetId,
              startRowIndex: existing.row_number - 1,
              endRowIndex: existing.row_number,
              startColumnIndex: 0,
              endColumnIndex: CLASS_MEMBER_HEADERS.length,
            },
            rows: [toRowData(updatedRow)],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [toRowData(auditRow)],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    membership_id: existing.membership_id,
    student_id: existing.student_id,
    class_id: existing.class_id,
    effective_from: existing.effective_from,
    effective_to: endDate,
    created_at: existing.created_at,
    updated_at: now,
  };
}

export async function moveClassMembership(studentId, newClassId, effectiveFrom, auditData) {
  const normalizedStudentId = String(studentId || "").trim();
  const normalizedClassId = String(newClassId || "").trim();
  const startDate = String(effectiveFrom || "").trim();

  if (!normalizedStudentId || !normalizedClassId) {
    throw new Error("INVALID_CLASS_MEMBER_DATA");
  }

  if (!isValidDate(startDate)) {
    throw new Error("INVALID_EFFECTIVE_FROM");
  }

  const memberships = await getClassMembersData();

  const currentMemberships = getActiveMemberships(memberships, normalizedStudentId, startDate);

  if (currentMemberships.length !== 1) {
    throw new Error("CURRENT_CLASS_MEMBERSHIP_NOT_FOUND");
  }

  const currentMembership = currentMemberships[0];

  if (currentMembership.class_id === normalizedClassId) {
    throw new Error("STUDENT_ALREADY_IN_TARGET_CLASS");
  }

  if (startDate <= currentMembership.effective_from) {
    throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
  }

  if (currentMembership.effective_to && startDate > currentMembership.effective_to) {
    throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
  }

  const previousEnd = getPreviousDate(startDate);

  const newMembershipData = assertValidMembershipData({
    student_id: normalizedStudentId,
    class_id: normalizedClassId,
    effective_from: startDate,
    effective_to: "",
  });

  assertNoMembershipOverlap(memberships, normalizedStudentId, startDate, "", currentMembership.membership_id);

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const { membersSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const newMembershipId = randomUUID();

  const updatedOldRow = [currentMembership.membership_id, currentMembership.student_id, currentMembership.class_id, currentMembership.effective_from, previousEnd, currentMembership.created_at, now];

  const newRow = [newMembershipId, newMembershipData.student_id, newMembershipData.class_id, newMembershipData.effective_from, newMembershipData.effective_to, now, now];

  const oldAuditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "UPDATE",
    table_name: SHEET_NAME,
    record_id: currentMembership.membership_id,
    reason: auditData?.reason || "Perpindahan kelas",
    old_data: getMembershipSnapshot(currentMembership),
    new_data: {
      ...getMembershipSnapshot(currentMembership),
      effective_to: previousEnd,
      updated_at: now,
    },
  });

  const newAuditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "CREATE",
    table_name: SHEET_NAME,
    record_id: newMembershipId,
    reason: auditData?.reason || "Perpindahan kelas",
    new_data: {
      membership_id: newMembershipId,
      ...newMembershipData,
      created_at: now,
      updated_at: now,
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: membersSheetId,
              startRowIndex: currentMembership.row_number - 1,
              endRowIndex: currentMembership.row_number,
              startColumnIndex: 0,
              endColumnIndex: CLASS_MEMBER_HEADERS.length,
            },
            rows: [toRowData(updatedOldRow)],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: membersSheetId,
            rows: [toRowData(newRow)],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [toRowData(oldAuditRow), toRowData(newAuditRow)],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    previous_membership: {
      membership_id: currentMembership.membership_id,
      student_id: currentMembership.student_id,
      class_id: currentMembership.class_id,
      effective_from: currentMembership.effective_from,
      effective_to: previousEnd,
      created_at: currentMembership.created_at,
      updated_at: now,
    },
    new_membership: {
      membership_id: newMembershipId,
      ...newMembershipData,
      created_at: now,
      updated_at: now,
    },
  };
}
