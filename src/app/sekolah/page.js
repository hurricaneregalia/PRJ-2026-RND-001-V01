import Image from "next/image";

import { connection } from "next/server";

import { getInformasiSekolah } from "@/services/sekolah-service";

export const instant = false;

export const metadata = {
  title: "Informasi Sekolah",
};

const DEFAULT_LOGO = "/images/logo-sekolah.svg";

export default async function InformasiSekolahPage() {
  await connection();
  const sekolah = await getInformasiSekolah();

  return (
    <main>
      <header>
        <h1>Informasi Sekolah</h1>
      </header>

      {!sekolah ? (
        <section>
          <p>Informasi sekolah belum tersedia.</p>
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
        </section>
      )}
    </main>
  );
}
