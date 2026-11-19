// src/config/database-schema.js

import { USER_HEADERS } from "@/config/user-config";

export const DATABASE_SCHEMA = {
  Users: USER_HEADERS,

  Students: ["student_id", "student_number", "full_name", "gender", "parent_name", "parent_relation", "parent_whatsapp", "student_status", "created_at", "updated_at"],

  Classes: ["class_id", "class_name", "class_status", "created_at", "updated_at"],

  Class_Members: ["membership_id", "student_id", "class_id", "effective_from", "effective_to", "created_at", "updated_at"],

  Teacher_Assignments: ["assignment_id", "user_id", "class_id", "effective_from", "effective_to", "created_at", "updated_at"],

  Attendance_Sessions: ["session_id", "class_id", "teacher_user_id", "academic_year_id", "attendance_date", "location_name", "location_note", "lesson_material", "created_at", "updated_at"],

  Attendance_Records: ["attendance_id", "session_id", "student_id", "membership_id", "status", "created_at", "updated_at"],

  Attendance_Audit_Logs: ["audit_id", "session_id", "attendance_id", "actor_user_id", "action_type", "old_data", "new_data", "reason", "changed_at"],

  Student_Contact_Logs: [
    "contact_log_id",
    "student_id",
    "teacher_user_id",
    "parent_name",
    "parent_relation",
    "destination_whatsapp",
    "period_start",
    "period_end",
    "alpa_count",
    "public_url",
    "action_status",
    "created_at",
  ],

  School_Information: ["school_id", "school_name", "school_address", "school_phone", "school_email", "school_logo_url", "principal_name", "created_at", "updated_at"],

  Administrative_Audit_Logs: ["admin_audit_id", "actor_user_id", "action_type", "table_name", "record_id", "old_data", "new_data", "reason", "created_at"],
};
