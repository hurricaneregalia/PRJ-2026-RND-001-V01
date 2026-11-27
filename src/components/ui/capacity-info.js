export default function CapacityInfo({ item, count = 0, max = 0 }) {
  const jumlah = Number(count) || 0;
  const maksimum = Number(max) || 0;
  const available = maksimum - jumlah;
  const statusLabel = available > 0 ? `Tersedia ${available} Kelas` : "Penuh";

  return (
    <span>
      {item} | {statusLabel}
    </span>
  );
}
