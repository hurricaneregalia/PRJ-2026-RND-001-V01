import { nowTimestamp } from '@/lib/date-time';
import { getKelasById } from '@/repositories/kelas-repository';
import { listKelasSiswaByKelasId, closeKelasSiswa, createKelasSiswa, updateKelasSiswa } from '@/repositories/kelas-siswa-repository';
import {
  createPemindahanKelas,
  getPemindahanKelasById,
  updatePemindahanKelas,
} from '@/repositories/pemindahan-kelas-repository';
import {
  createPemindahanKelasDetail,
  updatePemindahanKelasDetail,
} from '@/repositories/pemindahan-kelas-detail-repository';

export async function transferStudents({
  kelasAsalId,
  kelasTujuanId,
  tanggalPemindahan,
  dilakukanOleh,
  siswaIds,
}) {
  const kelasAsal = await getKelasById(kelasAsalId);
  const kelasTujuan = await getKelasById(kelasTujuanId);
  const memberships = await listKelasSiswaByKelasId(kelasAsalId);
  const selectedMemberships = memberships.filter(
    (item) => siswaIds.includes(item.siswa_id) && item.status_keanggotaan === 'aktif',
  );

  const batch = await createPemindahanKelas({
    kelas_asal_id: kelasAsalId,
    kelas_tujuan_id: kelasTujuanId,
    tanggal_pemindahan: tanggalPemindahan,
    dilakukan_oleh: dilakukanOleh,
    status: 'processing',
    total_siswa: selectedMemberships.length,
    jumlah_berhasil: 0,
    jumlah_gagal: 0,
    jumlah_dilewati: 0,
    waktu_mulai: nowTimestamp(),
  });

  let berhasil = 0;
  let gagal = 0;
  let dilewati = 0;

  for (const membership of selectedMemberships) {
    const detail = await createPemindahanKelasDetail({
      pemindahan_id: batch.pemindahan_id,
      siswa_id: membership.siswa_id,
      kelas_siswa_lama_id: membership.kelas_siswa_id,
      status_siswa: 'pending',
      waktu_mulai: nowTimestamp(),
    });

    try {
      const newMembership = await createKelasSiswa({
        kelas_id: kelasTujuanId,
        siswa_id: membership.siswa_id,
        tanggal_mulai: tanggalPemindahan,
        status_keanggotaan: 'pending',
      });

      await closeKelasSiswa(membership.kelas_siswa_id, tanggalPemindahan);
      await updateKelasSiswa(newMembership.kelas_siswa_id, {
        status_keanggotaan: 'aktif',
      });

      await updatePemindahanKelasDetail(detail.detail_id, {
        status_siswa: 'completed',
        waktu_selesai: nowTimestamp(),
      });

      berhasil += 1;
    } catch (error) {
      await updatePemindahanKelasDetail(detail.detail_id, {
        status_siswa: 'failed',
        error_message: error?.message || 'Transfer gagal',
        waktu_selesai: nowTimestamp(),
      });

      gagal += 1;
    }
  }

  const status =
    gagal === 0 ? 'completed' : (gagal > 0 ? 'partially_completed' : 'failed');
  const finalBatch = await updatePemindahanKelas(batch.pemindahan_id, {
    status,
    jumlah_berhasil: berhasil,
    jumlah_gagal: gagal,
    jumlah_dilewati: dilewati,
    waktu_selesai: nowTimestamp(),
  });

  return finalBatch;
}
