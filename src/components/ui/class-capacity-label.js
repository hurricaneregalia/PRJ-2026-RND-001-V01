export default function ClassCapacityLabel({ terisi = 0, kapasitas = 0 }) {
  const jumlahTerisi = Number(terisi) || 0;
  const jumlahKapasitas = Number(kapasitas) || 0;
  const available = jumlahKapasitas - jumlahTerisi;

  return <span>{available > 0 ? `Tersedia ${available} Kursi` : "Penuh"}</span>;
}