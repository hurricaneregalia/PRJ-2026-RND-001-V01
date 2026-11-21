// src/repositories/class-member-repository-mappers.js

import "server-only";

import { SHEET_NAME } from "./class-member-repository-constants";

export function createBulkResult(processed, skipped) {
  return {
    processed,
    skipped,
    processed_count: processed.length,
    skipped_count: skipped.length,
  };
}

export function createMembershipAuditData(auditData, actionType, membershipId, oldData, newData, reason) {
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

export function createMembershipRow(membership) {
  return [membership.membership_id, membership.student_id, membership.class_id, membership.effective_from, membership.effective_to, membership.created_at, membership.updated_at];
}

export function getMembershipSnapshot(membership) {
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
