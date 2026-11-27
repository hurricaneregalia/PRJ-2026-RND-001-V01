import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import BackButton from "@/components/ui/back-button";
import WhatsAppSubmitButton from "@/components/ui/whatsapp-submit-button";
import ContactHistoryList from "@/components/ui/contact-history-list";
import AttendanceCaseSummary from "@/components/ui/attendance-case-summary";
import { todayDate } from "@/lib/date-time";
import { parseRecordId } from "@/lib/id-generator";
import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { recordAuditCreate } from "@/repositories/audit-log-repository";
import { getKelasById } from "@/repositories/kelas-repository";
import { createPemantauan, findActivePemantauan } from "@/repositories/pemantauan-ketidakhadiran-repository";
import { createRiwayatKontak, listRiwayatKontakByPemantauanId } from "@/repositories/riwayat-kontak-repository";
import { getSiswaById } from "@/repositories/siswa-repository";
import { getUserById } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Hubungi Pengajar",
};

function shiftDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  const pad = (value) => String(value).padStart(2, "0");

  return [date.getFullYear(), "-", pad(date.getMonth() + 1), "-", pad(date.getDate())].join("");
}

function normalizeWhatsAppNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  return "";
}

function buildCaseData({ absensi, detail, kelasId, siswaId, periodStart, periodEnd }) {
  const sesi = absensi.filter((item) => item.kelas_id === kelasId && item.status_absensi === "final" && item.tanggal >= periodStart && item.tanggal <= periodEnd);
  const sesiById = new Map(sesi.map((item) => [item.absensi_id, item]));
  const detailSiswa = detail.filter((item) => sesiById.has(item.absensi_id) && item.siswa_id === siswaId);
  const rekap = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
  let terakhirAlfa = "";

  for (const item of detailSiswa) {
    if (rekap[item.status_kehadiran] !== undefined) {
      rekap[item.status_kehadiran] += 1;
    }

    if (item.status_kehadiran === "alfa") {
      const tanggal = sesiById.get(item.absensi_id)?.tanggal || "";

      if (tanggal > terakhirAlfa) {
        terakhirAlfa = tanggal;
      }
    }
  }

  return {
    totalSesi: sesi.length,
    rekap,
    jumlahAlfa: rekap.alfa,
    terakhirAlfa,
  };
}

function buildMessage({ pengajarName, pengajarJenisKelamin, siswa, kelas, data, periodStart, periodEnd }) {
  const sapaan = pengajarJenisKelamin === "P" ? "Ibu" : "Bapak";

  return [
    `Halo ${sapaan} ${pengajarName},`,
    "",
    `Kami ingin informasikan bahwa siswa ${siswa.nama} (NIS: ${siswa.nis || "-"}) kelas ${kelas.nama_kelas} memiliki status Alfa sebanyak ${data.jumlahAlfa} kali dalam periode ${periodStart} sampai ${periodEnd}.`,
    `Rekap kehadiran: Hadir ${data.rekap.hadir}, Izin ${data.rekap.izin}, Sakit ${data.rekap.sakit}, Alfa ${data.rekap.alfa}.`,
    "",
    `Mohon bantuan ${sapaan} untuk memperhatikan kondisi siswa tersebut dan melakukan tindak lanjut agar kehadirannya dalam pembelajaran dapat lebih baik.`,
    "",
    "Terima kasih atas perhatian dan kerja samanya.",
  ].join("\n");
}

function getStringParam(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function HubungiPengajarPage({ params, searchParams }) {
  await connection();
  const { pengajarId } = await params;
  const query = await searchParams;
  const siswaId = getStringParam(query?.siswaId);
  const kelasId = getStringParam(query?.kelasId);
  const status = getStringParam(query?.status);
  const session = await auth();
  const currentUserId = session?.user?.id || "";
  const pengajarRef = parseRecordId(pengajarId);
  const siswaRef = parseRecordId(siswaId);
  const kelasRef = parseRecordId(kelasId);
  const pengajar = pengajarRef?.prefix === "USR" ? await getUserById(pengajarId) : null;

  if (!pengajar || pengajar.role !== "Pengajar") {
    return (
      <main>
        <h1>Pengajar tidak ditemukan</h1>
        <p>Data pengajar tidak tersedia atau pengguna bukan pengajar.</p>
        <p>
          <Link href="/admin/laporan">Kembali ke Laporan</Link>
        </p>
      </main>
    );
  }

  if (siswaRef?.prefix !== "SIS" || kelasRef?.prefix !== "KLS") {
    return (
      <main>
        <h1>Kasus tidak ditemukan</h1>
        <p>Parameter siswaId dan kelasId diperlukan untuk membuka kasus ini.</p>
        <p>
          <Link href="/admin/pemantauan">Kembali ke Pemantauan</Link>
        </p>
      </main>
    );
  }

  const [kelas, siswa] = await Promise.all([getKelasById(kelasId), getSiswaById(siswaId)]);

  if (!kelas || kelas.pengajar_id !== pengajar.user_id) {
    return (
      <main>
        <h1>Kelas tidak ditemukan</h1>
        <p>Kelas tidak tersedia atau bukan kelas yang diajar pengajar ini.</p>
        <p>
          <Link href="/admin/pemantauan">Kembali ke Pemantauan</Link>
        </p>
      </main>
    );
  }

  if (!siswa) {
    return (
      <main>
        <h1>Siswa tidak ditemukan</h1>
        <p>Data siswa untuk kasus ini tidak tersedia.</p>
        <p>
          <Link href="/admin/pemantauan">Kembali ke Pemantauan</Link>
        </p>
      </main>
    );
  }

  const periodEnd = todayDate();
  const periodStart = shiftDate(periodEnd, -30);
  const [absensi, detail, pemantauan] = await Promise.all([listAbsensi(), listAbsensiDetail(), findActivePemantauan(siswa.siswa_id, kelas.kelas_id)]);
  const data = buildCaseData({
    absensi,
    detail,
    kelasId: kelas.kelas_id,
    siswaId: siswa.siswa_id,
    periodStart,
    periodEnd,
  });
  const riwayat = pemantauan ? await listRiwayatKontakByPemantauanId(pemantauan.pemantauan_id) : [];
  const riwayatTerurut = [...riwayat].sort((left, right) => String(right.tanggal_kontak).localeCompare(String(left.tanggal_kontak)));
  const nomorWhatsApp = normalizeWhatsAppNumber(pengajar.no_hp);
  const pesan = buildMessage({
    pengajarName: pengajar.name,
    pengajarJenisKelamin: pengajar.jenis_kelamin,
    siswa,
    kelas,
    data,
    periodStart,
    periodEnd,
  });
  const waUrl = nomorWhatsApp ? `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}` : "";
  const halamanKasus = `/admin/laporan/hubungi-pengajar/${pengajar.user_id}?siswaId=${encodeURIComponent(siswa.siswa_id)}&kelasId=${encodeURIComponent(kelas.kelas_id)}`;

  async function tandaiSudahDihubungi() {
    "use server";

    const actionSession = await auth();
    const actionUserId = actionSession?.user?.id || "";

    if (!actionUserId) {
      redirect(`${halamanKasus}&status=gagal`);
    }

    const [currentPengajar, currentKelas, currentSiswa] = await Promise.all([getUserById(pengajar.user_id), getKelasById(kelas.kelas_id), getSiswaById(siswa.siswa_id)]);

    if (!currentPengajar || currentPengajar.role !== "Pengajar" || !currentKelas || currentKelas.pengajar_id !== currentPengajar.user_id || !currentSiswa) {
      redirect(`${halamanKasus}&status=gagal`);
    }

    const actionPeriodEnd = todayDate();
    const actionPeriodStart = shiftDate(actionPeriodEnd, -30);
    const [currentAbsensi, currentDetail] = await Promise.all([listAbsensi(), listAbsensiDetail()]);
    const currentData = buildCaseData({
      absensi: currentAbsensi,
      detail: currentDetail,
      kelasId: currentKelas.kelas_id,
      siswaId: currentSiswa.siswa_id,
      periodStart: actionPeriodStart,
      periodEnd: actionPeriodEnd,
    });
    const currentNomorWhatsApp = normalizeWhatsAppNumber(currentPengajar.no_hp);

    if (!currentNomorWhatsApp) {
      redirect(`${halamanKasus}&status=gagal`);
    }

    let currentPemantauan = await findActivePemantauan(currentSiswa.siswa_id, currentKelas.kelas_id);

    if (!currentPemantauan) {
      try {
        currentPemantauan = await createPemantauan({
          siswa_id: currentSiswa.siswa_id,
          kelas_id: currentKelas.kelas_id,
          tanggal_mulai: todayDate(),
          jumlah_alpa_terakhir: currentData.jumlahAlfa,
          status_pemantauan: "aktif",
        });

        await recordAuditCreate({
          tableName: "pemantauan_ketidakhadiran",
          recordId: currentPemantauan.pemantauan_id,
          userId: actionUserId,
          after: currentPemantauan,
          note: "Pembuatan pemantauan dari halaman hubungi pengajar",
        });
      } catch (error) {
        if (error?.code !== "CONFLICT" && error?.code !== "DATA_INTEGRITY_ERROR") {
          throw error;
        }

        currentPemantauan = await findActivePemantauan(currentSiswa.siswa_id, currentKelas.kelas_id);
      }
    }

    if (!currentPemantauan) {
      redirect(`${halamanKasus}&status=gagal`);
    }

    const currentRiwayat = await listRiwayatKontakByPemantauanId(currentPemantauan.pemantauan_id);
    const sudahDihubungi = currentRiwayat.some(
      (item) => item.siswa_id === currentSiswa.siswa_id && item.kelas_id === currentKelas.kelas_id && item.tanggal_kontak === todayDate() && item.dikirim_oleh === actionUserId,
    );

    if (sudahDihubungi) {
      redirect(`${halamanKasus}&status=sudah`);
    }

    const currentPesan = buildMessage({
      pengajarName: currentPengajar.name,
      pengajarJenisKelamin: currentPengajar.jenis_kelamin,
      siswa: currentSiswa,
      kelas: currentKelas,
      data: currentData,
      periodStart: actionPeriodStart,
      periodEnd: actionPeriodEnd,
    });
    const kontak = await createRiwayatKontak({
      pemantauan_id: currentPemantauan.pemantauan_id,
      siswa_id: currentSiswa.siswa_id,
      kelas_id: currentKelas.kelas_id,
      pengajar_id: currentPengajar.user_id,
      jenis_pengirim: "Admin",
      jenis_penerima: "Pengajar",
      penerima_id: currentPengajar.user_id,
      nomor_whatsapp: currentNomorWhatsApp,
      pesan: currentPesan,
      jumlah_alpa_saat_kontak: currentData.jumlahAlfa,
      periode_awal: actionPeriodStart,
      periode_akhir: actionPeriodEnd,
      status_pengiriman: "dikonfirmasi_terkirim",
      dikirim_oleh: actionUserId,
      tanggal_kontak: todayDate(),
    });

    await recordAuditCreate({
      tableName: "riwayat_kontak",
      recordId: kontak.kontak_id,
      userId: actionUserId,
      after: kontak,
      note: "Pencatatan kontak pengajar dari halaman hubungi pengajar",
    });

    redirect(`${halamanKasus}&status=tersimpan`);
  }
  const jenisKelaminFX = siswa.jenis_kelamin === "P" ? "Perempuan" : "Laki-laki";
  return (
    <main>
      <header>
        <h1>Hubungi Pengajar</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/laporan">Laporan</Link> / <Link href="/admin/pemantauan">Pemantauan</Link> / Hubungi Pengajar
        </p>
      </header>

      {status === "tersimpan" ? <p>Riwayat kontak berhasil dicatat.</p> : null}
      {status === "sudah" ? <p>Kontak untuk kasus ini sudah dicatat hari ini.</p> : null}
      {status === "gagal" ? <p>Riwayat kontak gagal dicatat. Periksa data dan nomor WhatsApp pengajar.</p> : null}

      <section>
        <h2>Informasi Penerima Pesan</h2>
        <ul>
          <li>Nama Pengajar: {pengajar.name}</li>
        </ul>
      </section>

      <section>
        <h2>Informasi Siswa</h2>
        <ul>
          <li>Nama Siswa: {siswa.nama}</li>
          <li>NIS: {siswa.nis || "-"}</li>
          <li>Kelas: {kelas.nama_kelas}</li>
          <li>Jenis kelamin: {jenisKelaminFX}</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan Kehadiran 30 Hari Terakhir</h2>
        <AttendanceCaseSummary siswa={siswa} kelas={kelas} data={data} periodStart={periodStart} periodEnd={periodEnd} />
      </section>

      <section>
        <h2>Pesan WhatsApp</h2>
        <p>
          <label htmlFor="pesan">Pratinjau pesan</label>
          <br />
          <textarea id="pesan" defaultValue={pesan} rows={10} cols={60} readOnly />
        </p>

        <form action={tandaiSudahDihubungi}>
          {" "}
          <p>
            <BackButton btnText="Batal" />

            <WhatsAppSubmitButton waUrl={waUrl} disabled={!waUrl || !currentUserId}>
              Kirim Pesan
            </WhatsAppSubmitButton>
          </p>
        </form>
      </section>

      <section>
        <h2>Riwayat Kontak</h2>
        {riwayatTerurut.length === 0 ? (
          <p>Belum ada riwayat kontak untuk kasus ini.</p>
        ) : (
          <ContactHistoryList riwayat={riwayatTerurut} />
        )}
      </section>
    </main>
  );
}
