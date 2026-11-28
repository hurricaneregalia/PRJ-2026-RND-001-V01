import Link from "next/link";

export default function MonitoringList({ items = [], actions }) {
  if (items.length === 0) {
    return <p>Belum ada data pemantauan.</p>;
  }

  return (
    <ol>
      {items.map((item, index) => (
        <li key={item.siswa_id && item.kelas_id ? `${item.siswa_id}-${item.kelas_id}` : index}>
          <Link href={`/admin/siswa/${item.siswa_id}`}>{item.nama ?? item.siswaNama ?? item.siswa?.nama ?? "-"}</Link> |{item.nis || item.siswa?.nis ? <> {item.nis ?? item.siswa?.nis}</> : null} |
          {(item.kelas?.nama_kelas ?? item.kelas ?? null) ? <> {item.kelas?.nama_kelas ?? item.kelas}</> : null} | Alfa: {item.jumlahAlfa ?? item.jumlah_alpa ?? 0} |{" "}
          {actions ? <>{actions(item, index)}</> : null}
        </li>
      ))}
    </ol>
  );
}
