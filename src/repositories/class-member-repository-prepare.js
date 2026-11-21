// src/repositories/class-member-repository-prepare.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_MEMBER_HEADERS } from "@/config/class-member-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

import { getClassMembersData } from "./class-member-repository-data";
import { getRequiredSheetIds, toRowData } from "./class-member-repository-infrastructure";
import { createMembershipAuditData, getMembershipSnapshot } from "./class-member-repository-mappers";
import { getActiveMemberships, getPreviousDate, isValidDate } from "./class-member-repository-validation";

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
