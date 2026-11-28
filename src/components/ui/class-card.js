import Link from "next/link";

export default function ClassCard({ kelas, href, jumlahSiswa = 0, jadwal }) {
  const nama = kelas?.nama_kelas ?? kelas?.name ?? "-";
  const kode = kelas?.kode_kelas ?? kelas?.kode ?? "";
  const kapasitas = Number(kelas?.kapasitas ?? kelas?.capacity ?? 0) || 0;
  const terisi = Number(jumlahSiswa) || 0;

  return (
    <>
      {href ? <Link href={href}>{nama}</Link> : nama} | {terisi}/{kapasitas} | Tersedia {kapasitas - terisi} Kursi | {jadwal ? jadwal : "Belum Ada"}
    </>
  );
}
