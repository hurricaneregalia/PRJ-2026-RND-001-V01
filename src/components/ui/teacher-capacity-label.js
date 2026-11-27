export default function TeacherCapacityLabel({ terisi = 0, limit = 0 }) {
  const jumlahTerisi = Number(terisi) || 0;
  const jumlahLimit = Number(limit) || 0;
  const available = jumlahLimit - jumlahTerisi;

  return <span>{available > 0 ? `Tersedia ${available} Kelas` : "Penuh"}</span>;
}