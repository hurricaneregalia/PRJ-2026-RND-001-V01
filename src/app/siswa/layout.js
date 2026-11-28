import Link from "next/link";
import Image from "next/image";

import { connection } from "next/server";

import { getInformasiSekolah } from "@/services/sekolah-service";

export const instant = false;

const DEFAULT_LOGO = "/images/logo-sekolah.svg";

export default async function SiswaLayout({ children }) {
  await connection();
  const sekolah = await getInformasiSekolah();

  return (
    <>
      <header>
        <p>
          <Link href="/sekolah">
            <Image
              src={sekolah?.logo || DEFAULT_LOGO}
              alt={sekolah?.nama_sekolah || "Logo sekolah"}
              width={40}
              height={40}
              unoptimized
            />{" "}
            {sekolah?.nama_sekolah || "Informasi sekolah belum tersedia."}
          </Link>
        </p>
      </header>
      {children}
    </>
  );
}
