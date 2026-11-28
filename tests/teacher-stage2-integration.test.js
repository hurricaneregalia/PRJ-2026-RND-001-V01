import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function readSource(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const dashboard = readSource('src/app/pengajar/page.js');
const daftarKelas = readSource('src/app/pengajar/kelas/page.js');
const detailKelas = readSource('src/app/pengajar/kelas/[kelasId]/page.js');
const layout = readSource('src/app/pengajar/layout.js');
const allPages = [dashboard, daftarKelas, detailKelas, layout];

describe('integrasi baca Pengajar Tahap 2', () => {
  it('dashboard memakai service scoping dan repository yang tersedia', () => {
    expect(dashboard).toContain('listKelasForPengajar(user.id)');
    expect(dashboard).toContain('listKelasForPengajar(user.id, { includeNonaktif: true })');
    expect(dashboard).toContain('getKelasIdsForPengajar(user.id)');
    expect(dashboard).toContain('buildTeacherDashboardData({');
    expect(dashboard).toContain('getUserById(user.id)');
    expect(dashboard).toContain('listKelasSiswa()');
    expect(dashboard).toContain('listJadwal()');
    expect(dashboard).toContain('listSiswa()');
    expect(dashboard).toContain('listAbsensi()');
    expect(dashboard).toContain('listAbsensiDetail()');
    expect(dashboard).not.toContain('pravatar');
    expect(dashboard).not.toContain('Budi');
    expect(dashboard).not.toMatch(/KLS-\d{4}/);
  });

  it('daftar kelas hanya mengambil kelas melalui service scoping', () => {
    expect(daftarKelas).toContain('listKelasForPengajar(user.id)');
    expect(daftarKelas).not.toContain('includeNonaktif');
    expect(daftarKelas).not.toMatch(/\blistKelas\(/);
    expect(daftarKelas).not.toMatch(/KLS-\d{4}/);
    expect(daftarKelas).not.toContain('Matematika A');
    expect(daftarKelas).not.toContain('Bahasa Inggris A');
  });

  it('detail kelas memvalidasi kepemilikan memakai service', () => {
    expect(detailKelas).toContain('getKelasForPengajar(user.id, kelasId)');
    expect(detailKelas).toContain('collectFinalAbsensiDetail({');
    expect(detailKelas).toContain('notFound()');
    expect(detailKelas).not.toContain('kelasData');
    expect(detailKelas).not.toMatch(/KLS-\d{4}/);
    expect(detailKelas).not.toContain('requireActive: true');
  });

  it('detail kelas nonaktif tetap dibaca tanpa jalur tulis', () => {
    expect(detailKelas).toContain('kelas.status_kelas === "aktif"');
    expect(detailKelas).toContain('Penulisan absensi tidak tersedia untuk kelas nonaktif.');
  });

  it('semua halaman Pengajar menolak Admin dan sesi invalid', () => {
    for (const source of allPages) {
      expect(source).toContain('redirect("/admin")');
      expect(source).toContain('redirect("/login")');
    }
  });

  it('tidak ada halaman yang memakai created_by sebagai dasar akses', () => {
    for (const source of allPages) {
      expect(source).not.toContain('created_by');
    }
  });
});
