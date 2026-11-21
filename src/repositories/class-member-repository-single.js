// src/repositories/class-member-repository-single.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_MEMBER_HEADERS } from "@/config/class-member-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

import { SPREADSHEET_ID, SHEET_NAME } from "./class-member-repository-constants";
import { getClassMembersData } from "./class-member-repository-data";
import { getRequiredSheetIds, toRowData } from "./class-member-repository-infrastructure";
import { getMembershipSnapshot } from "./class-member-repository-mappers";
import { assertNoMembershipOverlap, assertValidMembershipData, getActiveMemberships, getPreviousDate, isValidDate } from "./class-member-repository-validation";

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
