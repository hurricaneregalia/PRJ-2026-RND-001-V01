export default function MonitoringList({ items = [], actions }) {
  if (items.length === 0) {
    return <p>Belum ada data pemantauan.</p>;
  }

  return (
    <ol>
      {items.map((item, index) => (
        <li key={item.siswa_id && item.kelas_id ? `${item.siswa_id}-${item.kelas_id}` : index}>
          <p>{item.nama ?? item.siswaNama ?? item.siswa?.nama ?? "-"}</p>
          {item.nis || item.siswa?.nis ? <p>NIS: {item.nis ?? item.siswa?.nis}</p> : null}
          {item.kelas?.nama_kelas ?? item.kelas ?? null ? <p>Kelas: {item.kelas?.nama_kelas ?? item.kelas}</p> : null}
          <p>Jumlah Alfa: {item.jumlahAlfa ?? item.jumlah_alpa ?? 0}</p>
          <p>Terakhir: {item.terakhir ?? item.terakhirAlfa ?? "-"}</p>
          {actions ? <p>{actions(item, index)}</p> : null}
        </li>
      ))}
    </ol>
  );
}
