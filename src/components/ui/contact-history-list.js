export default function ContactHistoryList({ riwayat = [] }) {
  if (riwayat.length === 0) {
    return <p>Belum ada riwayat kontak.</p>;
  }

  return (
    <ol>
      {riwayat.map((item) => (
        <li key={item.riwayat_kontak_id ?? item.kontak_id ?? item.id}>
          {item.tanggal_kontak || "-"} | {item.status_pengiriman || "-"} | Oleh: {item.dikirim_oleh || "-"}
        </li>
      ))}
    </ol>
  );
}