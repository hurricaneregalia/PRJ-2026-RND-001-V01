import Link from "next/link";
import Image from "next/image";

import { connection } from "next/server";

import { getInformasiSekolah } from "@/services/sekolah-service";

export const instant = false;

export const metadata = {
  title: "Kelola Informasi Sekolah",
};

const DEFAULT_LOGO = "/images/logo-sekolah.svg";

export default async function KelolaInformasiSekolahPage() {
  await connection();
  const sekolah = await getInformasiSekolah();

  return (
    <main>
      <header>
        <h1>Kelola Informasi Sekolah</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / Kelola Informasi Sekolah
        </p>
      </header>

      {!sekolah ? (
        <section>
          <p>Informasi sekolah belum tersedia.</p>
          <p>
            <Link href="/admin/sekolah/tambah">Lengkapi Informasi Sekolah</Link>
          </p>
        </section>
      ) : (
        <section>
          <Image src={sekolah.logo || DEFAULT_LOGO} alt={`Logo ${sekolah.nama_sekolah}`} width={160} height={160} unoptimized />
          <h2>{sekolah.nama_sekolah}</h2>
          <ul>
            <li>Alamat: {sekolah.alamat || "-"}</li>
            <li>Nomor HP: {sekolah.no_hp || "-"}</li>
            <li>Email: {sekolah.email || "-"}</li>
          </ul>
          <p>
            <Link href="/admin/sekolah/edit">Edit Informasi Sekolah</Link>
          </p>
          <p>
            <Link href="/sekolah">Lihat Halaman Publik</Link>
          </p>
        </section>
      )}
    </main>
  );
}
