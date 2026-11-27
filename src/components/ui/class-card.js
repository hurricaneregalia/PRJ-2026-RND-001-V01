import Link from "next/link";

export default function ClassCard({ kelas, href, jumlahSiswa = 0, jadwal }) {
  const nama = kelas?.nama_kelas ?? kelas?.name ?? "-";
  const kode = kelas?.kode_kelas ?? kelas?.kode ?? "";
  const kapasitas = Number(kelas?.kapasitas ?? kelas?.capacity ?? 0) || 0;
  const terisi = Number(jumlahSiswa) || 0;

  return (
    <section>
      <h3>{href ? <Link href={href}>{nama}</Link> : nama}</h3>
      {kode ? <p>Kode: {kode}</p> : null}
      <p>
        Kapasitas: {terisi}/{kapasitas}
      </p>
      <p>Tersedia: {kapasitas - terisi} Kursi</p>
      <p>Jadwal: {jadwal ? jadwal : "Belum Ada"}</p>
    </section>
  );
}
