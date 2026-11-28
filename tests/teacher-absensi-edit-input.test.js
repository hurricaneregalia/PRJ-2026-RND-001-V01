import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseTeacherAbsensiEditForm } from '@/services/teacher-absensi-edit-input';

const OPERATION_ID = '123e4567-e89b-42d3-a456-426614174000';
const OPERATION_TIMESTAMP = '2026-11-28T21:00:00';
const DETAIL_IDS = ['ABD-0001', 'ABD-0002'];

function buildForm(overrides = {}) {
  const form = new FormData();
  form.set('operationId', overrides.operationId ?? OPERATION_ID);
  form.set(
    'operationTimestamp',
    overrides.operationTimestamp ?? OPERATION_TIMESTAMP,
  );
  form.set('topik', overrides.topik ?? 'Aljabar dasar');
  form.set('auditIds', overrides.auditIds ?? '{}');

  const ids = overrides.detailIds ?? DETAIL_IDS;
  for (const id of ids) {
    form.append('absensiDetailId', id);
    form.set(`status_${id}`, overrides[`status_${id}`] ?? 'hadir');
    form.set(`catatan_${id}`, overrides[`catatan_${id}`] ?? 'Baik');
  }

  return form;
}

describe('parseTeacherAbsensiEditForm', () => {
  it('membangun input batch dari form yang valid', () => {
    const result = parseTeacherAbsensiEditForm(buildForm(), DETAIL_IDS);

    expect(result.status).toBe('ok');
    expect(result.data).toEqual({
      operationId: OPERATION_ID,
      operationTimestamp: OPERATION_TIMESTAMP,
      topik: 'Aljabar dasar',
      details: [
        {
          absensiDetailId: 'ABD-0001',
          statusKehadiran: 'hadir',
          catatan: 'Baik',
        },
        {
          absensiDetailId: 'ABD-0002',
          statusKehadiran: 'hadir',
          catatan: 'Baik',
        },
      ],
      auditIds: {},
    });
  });

  it('menolak daftar detail duplikat, asing, dan kurang', () => {
    expect(
      parseTeacherAbsensiEditForm(
        buildForm({ detailIds: ['ABD-0001', 'ABD-0001'] }),
        DETAIL_IDS,
      ),
    ).toMatchObject({ status: 'invalid', data: { field: 'details' } });

    expect(
      parseTeacherAbsensiEditForm(
        buildForm({ detailIds: ['ABD-0001', 'ABD-9999'] }),
        DETAIL_IDS,
      ),
    ).toMatchObject({ status: 'invalid', data: { field: 'details' } });

    expect(
      parseTeacherAbsensiEditForm(buildForm({ detailIds: ['ABD-0001'] }), DETAIL_IDS),
    ).toMatchObject({ status: 'invalid', data: { field: 'details' } });
  });

  it('menolak operationId dan operationTimestamp yang tidak valid', () => {
    expect(
      parseTeacherAbsensiEditForm(buildForm({ operationId: 'bukan-uuid' }), DETAIL_IDS),
    ).toMatchObject({ status: 'invalid', data: { field: 'operationId' } });

    expect(
      parseTeacherAbsensiEditForm(
        buildForm({ operationTimestamp: '28-11-2026' }),
        DETAIL_IDS,
      ),
    ).toMatchObject({ status: 'invalid', data: { field: 'operationTimestamp' } });
  });

  it('menolak status di luar enum dan topik atau catatan terlalu panjang', () => {
    expect(
      parseTeacherAbsensiEditForm(
        buildForm({ 'status_ABD-0001': 'hadir juga' }),
        DETAIL_IDS,
      ),
    ).toMatchObject({ status: 'invalid', data: { field: 'status_kehadiran' } });

    expect(
      parseTeacherAbsensiEditForm(buildForm({ topik: 'x'.repeat(501) }), DETAIL_IDS),
    ).toMatchObject({ status: 'invalid', data: { field: 'topik' } });

    expect(
      parseTeacherAbsensiEditForm(
        buildForm({ 'catatan_ABD-0001': 'x'.repeat(501) }),
        DETAIL_IDS,
      ),
    ).toMatchObject({ status: 'invalid', data: { field: 'catatan' } });
  });

  it('menolak auditIds yang bukan objek', () => {
    expect(
      parseTeacherAbsensiEditForm(buildForm({ auditIds: '["AUD-0001"]' }), DETAIL_IDS),
    ).toMatchObject({ status: 'invalid', data: { field: 'auditIds' } });

    expect(
      parseTeacherAbsensiEditForm(buildForm({ auditIds: '{' }), DETAIL_IDS),
    ).toMatchObject({ status: 'invalid', data: { field: 'auditIds' } });
  });
});

function readSource(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('integrasi halaman edit absensi Pengajar', () => {
  const editDir =
    'src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/edit/';

  it('halaman memakai data aktual dan menolak akses invalid', () => {
    const page = readSource(`${editDir}page.js`);

    expect(page).toContain('notFound()');
    expect(page).toContain('getKelasForPengajar(user.id, kelasId, {');
    expect(page).toContain('requireActive: true');
    expect(page).toContain('getAbsensiForPengajar(user.id, kelasId, absensiId)');
    expect(page).toContain('simpanEditAbsensiPengajar.bind(null, kelasId, absensiId)');
    expect(page).toContain('listAbsensiDetailByAbsensiId(absensiId)');
    expect(page).toContain('name="operationId"');
    expect(page).toContain('name="operationTimestamp"');
    expect(page).toContain('name="auditIds"');
    expect(page).not.toContain('Andi');
    expect(page).not.toContain('Citra');
  });

  it('action memeriksa ulang akses dan memakai satu jalur batch', () => {
    const actions = readSource(`${editDir}actions.js`);

    expect(actions).toContain('"use server"');
    expect(actions).toContain('redirect("/pengajar")');
    expect(actions).toContain('user.role !== "Pengajar"');
    expect(actions).toContain('requireActive: true');
    expect(actions).toContain('getAbsensiForPengajar(user.id, kelasId, absensiId)');
    expect(actions).toContain('updateTeacherAbsensiBatch({');
    expect(actions).not.toContain('updateAbsensi(');
    expect(actions).not.toContain('updateAbsensiDetail(');
  });
});
