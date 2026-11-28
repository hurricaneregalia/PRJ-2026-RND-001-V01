import { describe, expect, it } from 'vitest';

import {
  addAbsensiCount,
  buildTeacherDashboardData,
  collectFinalAbsensiDetail,
  createAbsensiCounts,
} from '@/lib/teacher-dashboard-recap';

function makeData() {
  return {
    activeKelas: [
      {
        kelas_id: 'KLS-0001',
        nama_kelas: 'Matematika A',
        status_kelas: 'aktif',
      },
    ],
    allOwnedKelas: [
      {
        kelas_id: 'KLS-0001',
        nama_kelas: 'Matematika A',
        status_kelas: 'aktif',
      },
      {
        kelas_id: 'KLS-0002',
        nama_kelas: 'Matematika B',
        status_kelas: 'nonaktif',
      },
    ],
    ownedKelasIds: ['KLS-0001', 'KLS-0002'],
    memberships: [
      {
        kelas_siswa_id: 'KS-0001',
        kelas_id: 'KLS-0001',
        siswa_id: 'SIS-0001',
        status_keanggotaan: 'aktif',
      },
      {
        kelas_siswa_id: 'KS-0002',
        kelas_id: 'KLS-0002',
        siswa_id: 'SIS-0002',
        status_keanggotaan: 'aktif',
      },
      {
        kelas_siswa_id: 'KS-0003',
        kelas_id: 'KLS-0003',
        siswa_id: 'SIS-0001',
        status_keanggotaan: 'aktif',
      },
      {
        kelas_siswa_id: 'KS-0004',
        kelas_id: 'KLS-0001',
        siswa_id: 'SIS-0002',
        status_keanggotaan: 'selesai',
      },
    ],
    siswa: [
      { siswa_id: 'SIS-0001', nama: 'Ani' },
      { siswa_id: 'SIS-0002', nama: 'Budi' },
    ],
    jadwal: [
      {
        jadwal_id: 'JDW-0001',
        kelas_id: 'KLS-0001',
        hari: 'Senin',
        jam_mulai: '08:00',
        jam_selesai: '09:00',
        status_jadwal: 'aktif',
      },
      { jadwal_id: 'JDW-0002', kelas_id: 'KLS-0002', status_jadwal: 'aktif' },
      { jadwal_id: 'JDW-0003', kelas_id: 'KLS-0003', status_jadwal: 'aktif' },
    ],
    absensi: [
      { absensi_id: 'ABS-0001', kelas_id: 'KLS-0001', status_absensi: 'final' },
      { absensi_id: 'ABS-0002', kelas_id: 'KLS-0002', status_absensi: 'final' },
      { absensi_id: 'ABS-0003', kelas_id: 'KLS-0001', status_absensi: 'draft' },
      { absensi_id: 'ABS-0004', kelas_id: 'KLS-0003', status_absensi: 'final' },
    ],
    detail: [
      {
        absensi_detail_id: 'AD-0001',
        absensi_id: 'ABS-0001',
        siswa_id: 'SIS-0001',
        status_kehadiran: 'hadir',
      },
      {
        absensi_detail_id: 'AD-0002',
        absensi_id: 'ABS-0002',
        siswa_id: 'SIS-0001',
        status_kehadiran: 'sakit',
      },
      {
        absensi_detail_id: 'AD-0003',
        absensi_id: 'ABS-0003',
        siswa_id: 'SIS-0001',
        status_kehadiran: 'alfa',
      },
      {
        absensi_detail_id: 'AD-0004',
        absensi_id: 'ABS-0004',
        siswa_id: 'SIS-0001',
        status_kehadiran: 'alfa',
      },
      {
        absensi_detail_id: 'AD-0001',
        absensi_id: 'ABS-0001',
        siswa_id: 'SIS-0001',
        status_kehadiran: 'alfa',
      },
      {
        absensi_detail_id: 'AD-0005',
        absensi_id: 'ABS-0001',
        siswa_id: 'SIS-0001',
        status_kehadiran: 'izin',
      },
      {
        absensi_detail_id: 'AD-0006',
        absensi_id: 'ABS-0001',
        siswa_id: 'SIS-0002',
        status_kehadiran: 'izin',
      },
    ],
  };
}

describe('buildTeacherDashboardData', () => {
  it('memisahkan rekap siswa yang sama di dua kelas', () => {
    const { recapSiswa } = buildTeacherDashboardData(makeData());
    const ani = recapSiswa.filter((item) => item.siswaId === 'SIS-0001');

    expect(ani).toHaveLength(2);
    expect(ani.map((item) => item.kelasId)).toEqual(['KLS-0001', 'KLS-0002']);
    expect(ani.map((item) => item.namaKelas)).toEqual(['Matematika A', 'Matematika B']);
    expect(ani.map((item) => item.key)).toEqual([
      'SIS-0001::KLS-0001',
      'SIS-0001::KLS-0002',
    ]);
    expect(ani[0].counts).toEqual({ hadir: 1, izin: 0, sakit: 0, alfa: 0 });
    expect(ani[1].counts).toEqual({ hadir: 0, izin: 0, sakit: 1, alfa: 0 });
  });

  it('memasukkan rekap kelas nonaktif milik pengajar', () => {
    const { recapSiswa } = buildTeacherDashboardData(makeData());
    const nonaktif = recapSiswa.find((item) => item.kelasId === 'KLS-0002');

    expect(nonaktif).toMatchObject({
      siswaId: 'SIS-0001',
      nama: 'Ani',
      namaKelas: 'Matematika B',
      counts: { hadir: 0, izin: 0, sakit: 1, alfa: 0 },
    });
  });

  it('hanya menghitung baris dari absensi final dan kelas milik pengajar', () => {
    const data = makeData();
    const rows = collectFinalAbsensiDetail(data);
    const ids = rows.map((item) => item.absensi_id);

    expect(ids).toContain('ABS-0001');
    expect(ids).toContain('ABS-0002');
    expect(ids).not.toContain('ABS-0003');
    expect(ids).not.toContain('ABS-0004');

    const counts = createAbsensiCounts();

    for (const row of rows) {
      addAbsensiCount(counts, row.status_kehadiran);
    }

    expect(counts).toEqual({ hadir: 1, izin: 1, sakit: 1, alfa: 0 });
  });

  it('tidak menghitung detail absensi ganda', () => {
    const rows = collectFinalAbsensiDetail(makeData());
    const detailIds = rows.map((item) => item.absensi_detail_id);
    const pairs = rows.map((item) => `${item.absensi_id}::${item.siswa_id}`);

    expect(detailIds).toEqual(['AD-0001', 'AD-0002', 'AD-0006']);
    expect(new Set(pairs).size).toBe(pairs.length);

    const counts = createAbsensiCounts();

    for (const row of rows) {
      addAbsensiCount(counts, row.status_kehadiran);
    }

    expect(counts).toEqual({ hadir: 1, izin: 1, sakit: 1, alfa: 0 });
  });

  it('membatasi jumlah siswa dan jadwal ke kelas aktif milik pengajar', () => {
    const { activeCountByKelas, jadwalByKelas } = buildTeacherDashboardData(makeData());

    expect(activeCountByKelas.get('KLS-0001')).toBe(1);
    expect(activeCountByKelas.has('KLS-0002')).toBe(false);
    expect(activeCountByKelas.has('KLS-0003')).toBe(false);
    expect(jadwalByKelas.has('KLS-0001')).toBe(true);
    expect(jadwalByKelas.has('KLS-0002')).toBe(false);
    expect(jadwalByKelas.has('KLS-0003')).toBe(false);
  });
});
