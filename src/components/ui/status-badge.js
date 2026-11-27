const DEFAULT_LABELS = {
  active: "Aktif",
  inactive: "Nonaktif",
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  final: "Final",
  draft: "Draft",
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alfa: "Alfa",
  alpa: "Alfa",
};

export default function StatusBadge({ value, labels = {} }) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const label = labels[value] ?? labels[normalized] ?? DEFAULT_LABELS[normalized] ?? value ?? "-";

  return <span>{label}</span>;
}
