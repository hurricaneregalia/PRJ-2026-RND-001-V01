import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@/lib/data-errors';
import { getAbsensiById } from '@/repositories/absensi-repository';
import { getKelasById, listKelas } from '@/repositories/kelas-repository';
import {
  getAbsensiForPengajar,
  getKelasForPengajar,
  getKelasIdsForPengajar,
  listKelasForPengajar,
} from '@/services/teacher-scope-service';

vi.mock('@/repositories/absensi-repository', () => ({
  getAbsensiById: vi.fn(),
}));

vi.mock('@/repositories/kelas-repository', () => ({
  getKelasById: vi.fn(),
  listKelas: vi.fn(),
}));

const TEACHER_ID = 'USR-0002';
const OTHER_TEACHER_ID = 'USR-0003';

const kelasAktif = {
  kelas_id: 'KLS-0001',
  nama_kelas: 'Matematika A',
  pengajar_id: TEACHER_ID,
  kapasitas: 15,
  status_kelas: 'aktif',
};

const kelasNonaktif = {
  kelas_id: 'KLS-0002',
  nama_kelas: 'Matematika B',
  pengajar_id: TEACHER_ID,
  kapasitas: 15,
  status_kelas: 'nonaktif',
};

const kelasPengajarLain = {
  kelas_id: 'KLS-0003',
  nama_kelas: 'Bahasa Inggris A',
  pengajar_id: OTHER_TEACHER_ID,
  kapasitas: 12,
  status_kelas: 'aktif',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getKelasForPengajar', () => {
  it('mengizinkan pengajar mengakses kelas miliknya', async () => {
    getKelasById.mockResolvedValue(kelasAktif);

    const result = await getKelasForPengajar(TEACHER_ID, kelasAktif.kelas_id);

    expect(result).toEqual({ status: 'ok', data: kelasAktif });
  });

  it('menolak kelas milik pengajar lain', async () => {
    getKelasById.mockResolvedValue(kelasPengajarLain);

    const result = await getKelasForPengajar(TEACHER_ID, kelasPengajarLain.kelas_id);

    expect(result).toEqual({ status: 'forbidden' });
  });

  it('mengembalikan not_found jika kelas tidak ditemukan', async () => {
    getKelasById.mockResolvedValue(null);

    const result = await getKelasForPengajar(TEACHER_ID, 'KLS-9999');

    expect(result).toEqual({ status: 'not_found' });
  });

  it('mengembalikan not_found jika ID kelas tidak valid', async () => {
    getKelasById.mockRejectedValue(new ValidationError('invalid kelas_id'));

    const result = await getKelasForPengajar(TEACHER_ID, 'bukan-id');

    expect(result).toEqual({ status: 'not_found' });
  });

  it('tetap mengizinkan pemilik membaca kelas nonaktif', async () => {
    getKelasById.mockResolvedValue(kelasNonaktif);

    const result = await getKelasForPengajar(TEACHER_ID, kelasNonaktif.kelas_id);

    expect(result).toEqual({ status: 'ok', data: kelasNonaktif });
  });

  it('menolak kelas nonaktif untuk penulisan', async () => {
    getKelasById.mockResolvedValue(kelasNonaktif);

    const result = await getKelasForPengajar(TEACHER_ID, kelasNonaktif.kelas_id, {
      requireActive: true,
    });

    expect(result).toEqual({ status: 'forbidden' });
  });

  it('menolak permintaan tanpa identitas pengajar', async () => {
    const result = await getKelasForPengajar('', kelasAktif.kelas_id);

    expect(result).toEqual({ status: 'forbidden' });
    expect(getKelasById).not.toHaveBeenCalled();
  });
});

describe('listKelasForPengajar', () => {
  it('hanya mengembalikan kelas aktif milik pengajar secara default', async () => {
    listKelas.mockResolvedValue([kelasAktif, kelasNonaktif, kelasPengajarLain]);

    const result = await listKelasForPengajar(TEACHER_ID);

    expect(result).toEqual({ status: 'ok', data: [kelasAktif] });
  });

  it('menyertakan kelas nonaktif jika diminta', async () => {
    listKelas.mockResolvedValue([kelasAktif, kelasNonaktif, kelasPengajarLain]);

    const result = await listKelasForPengajar(TEACHER_ID, {
      includeNonaktif: true,
    });

    expect(result).toEqual({
      status: 'ok',
      data: [kelasAktif, kelasNonaktif],
    });
  });

  it('mengembalikan daftar kosong jika pengajar tidak memiliki kelas', async () => {
    listKelas.mockResolvedValue([kelasPengajarLain]);

    const result = await listKelasForPengajar(TEACHER_ID);

    expect(result).toEqual({ status: 'ok', data: [] });
  });

  it('mengembalikan daftar kosong tanpa identitas pengajar', async () => {
    const result = await listKelasForPengajar('');

    expect(result).toEqual({ status: 'ok', data: [] });
    expect(listKelas).not.toHaveBeenCalled();
  });
});

describe('getKelasIdsForPengajar', () => {
  it('mengembalikan semua kelas milik pengajar, termasuk nonaktif', async () => {
    listKelas.mockResolvedValue([kelasAktif, kelasPengajarLain, kelasNonaktif]);

    const result = await getKelasIdsForPengajar(TEACHER_ID);

    expect(result).toEqual({
      status: 'ok',
      data: [kelasAktif.kelas_id, kelasNonaktif.kelas_id],
    });
  });

  it('mengembalikan daftar kosong jika pengajar tidak memiliki kelas', async () => {
    listKelas.mockResolvedValue([kelasPengajarLain]);

    const result = await getKelasIdsForPengajar(TEACHER_ID);

    expect(result).toEqual({ status: 'ok', data: [] });
  });
});

describe('getAbsensiForPengajar', () => {
  it('mengizinkan absensi yang terkait kelas milik pengajar', async () => {
    const absensi = {
      absensi_id: 'ABS-0001',
      kelas_id: kelasAktif.kelas_id,
      tanggal: '2026-11-24',
      status_absensi: 'final',
    };
    getKelasById.mockResolvedValue(kelasAktif);
    getAbsensiById.mockResolvedValue(absensi);

    const result = await getAbsensiForPengajar(
      TEACHER_ID,
      kelasAktif.kelas_id,
      absensi.absensi_id,
    );

    expect(result).toEqual({ status: 'ok', data: absensi });
  });

  it('menolak absensi dari kelas lain', async () => {
    getKelasById.mockResolvedValue(kelasAktif);
    getAbsensiById.mockResolvedValue({
      absensi_id: 'ABS-0002',
      kelas_id: kelasPengajarLain.kelas_id,
      status_absensi: 'final',
    });

    const result = await getAbsensiForPengajar(
      TEACHER_ID,
      kelasAktif.kelas_id,
      'ABS-0002',
    );

    expect(result).toEqual({ status: 'forbidden' });
  });

  it('mengembalikan not_found jika absensi tidak ditemukan', async () => {
    getKelasById.mockResolvedValue(kelasAktif);
    getAbsensiById.mockResolvedValue(null);

    const result = await getAbsensiForPengajar(
      TEACHER_ID,
      kelasAktif.kelas_id,
      'ABS-9999',
    );

    expect(result).toEqual({ status: 'not_found' });
  });

  it('mengembalikan not_found jika ID absensi tidak valid', async () => {
    getKelasById.mockResolvedValue(kelasAktif);
    getAbsensiById.mockRejectedValue(new ValidationError('invalid absensi_id'));

    const result = await getAbsensiForPengajar(
      TEACHER_ID,
      kelasAktif.kelas_id,
      'bukan-id',
    );

    expect(result).toEqual({ status: 'not_found' });
  });

  it('menolak absensi jika kelas bukan milik pengajar', async () => {
    getKelasById.mockResolvedValue(kelasPengajarLain);

    const result = await getAbsensiForPengajar(
      TEACHER_ID,
      kelasPengajarLain.kelas_id,
      'ABS-0001',
    );

    expect(result).toEqual({ status: 'forbidden' });
    expect(getAbsensiById).not.toHaveBeenCalled();
  });

  it('mengembalikan not_found jika kelas tidak ditemukan', async () => {
    getKelasById.mockResolvedValue(null);

    const result = await getAbsensiForPengajar(TEACHER_ID, 'KLS-9999', 'ABS-0001');

    expect(result).toEqual({ status: 'not_found' });
    expect(getAbsensiById).not.toHaveBeenCalled();
  });
});
