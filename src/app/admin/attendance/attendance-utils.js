"use client";

export const LOCATION_TYPE_LABELS = {
  IN_CLASS: "Dalam kelas",
  OUTSIDE_CLASS: "Luar kelas",
};

export function formatLocation(session) {
  if (session.location_type === "IN_CLASS") {
    return "Dalam kelas";
  }

  return session.location_name || "Luar kelas";
}