import {
  createSekolah,
  getSekolahById,
  listSekolah,
  updateSekolah,
} from '@/repositories/sekolah-repository';
import { recordAuditCreate, recordAuditUpdate } from '@/repositories/audit-log-repository';

export async function getInformasiSekolah() {
  const records = await listSekolah();
  return records[0] ?? null;
}

export async function simpanInformasiSekolah({ data, actorId }) {
  const existing = await getInformasiSekolah();

  if (existing) {
    const after = await updateSekolah(existing.sekolah_id, data);

    await recordAuditUpdate({
      tableName: 'sekolah',
      recordId: after.sekolah_id,
      userId: actorId || '',
      before: existing,
      after,
      note: 'Perubahan informasi sekolah dari halaman admin',
    });

    return after;
  }

  const created = await createSekolah(data);

  await recordAuditCreate({
    tableName: 'sekolah',
    recordId: created.sekolah_id,
    userId: actorId || '',
    after: created,
    note: 'Pembuatan informasi sekolah dari halaman admin',
  });

  return created;
}

export async function getSekolahUntukDiedit(sekolahId) {
  return getSekolahById(sekolahId);
}
