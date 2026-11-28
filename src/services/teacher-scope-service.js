import { ValidationError } from '@/lib/data-errors';
import { getAbsensiById } from '@/repositories/absensi-repository';
import { getKelasById, listKelas } from '@/repositories/kelas-repository';

function normalizeId(value) {
  return String(value ?? '').trim();
}

function isSameId(left, right) {
  return normalizeId(left) === normalizeId(right);
}

async function findKelasById(kelasId) {
  try {
    return await getKelasById(kelasId);
  } catch (error) {
    if (error instanceof ValidationError) {
      return null;
    }

    throw error;
  }
}

async function findAbsensiById(absensiId) {
  try {
    return await getAbsensiById(absensiId);
  } catch (error) {
    if (error instanceof ValidationError) {
      return null;
    }

    throw error;
  }
}

/**
 * Returns the class only when it belongs to the given teacher.
 * Use requireActive for write paths so inactive classes remain read-only.
 */
export async function getKelasForPengajar(
  pengajarId,
  kelasId,
  { requireActive = false } = {},
) {
  const teacherId = normalizeId(pengajarId);
  const id = normalizeId(kelasId);

  if (!teacherId) {
    return { status: 'forbidden' };
  }

  if (!id) {
    return { status: 'not_found' };
  }

  const kelas = await findKelasById(id);

  if (!kelas) {
    return { status: 'not_found' };
  }

  if (!isSameId(kelas.pengajar_id, teacherId)) {
    return { status: 'forbidden' };
  }

  if (requireActive && kelas.status_kelas !== 'aktif') {
    return { status: 'forbidden' };
  }

  return { status: 'ok', data: kelas };
}

/**
 * Lists classes owned by the teacher. Inactive classes are excluded by default
 * because active lists must not offer archived classes.
 */
export async function listKelasForPengajar(
  pengajarId,
  { includeNonaktif = false } = {},
) {
  const teacherId = normalizeId(pengajarId);

  if (!teacherId) {
    return { status: 'ok', data: [] };
  }

  const kelas = await listKelas();
  const owned = kelas.filter((item) => isSameId(item.pengajar_id, teacherId));
  const data = includeNonaktif
    ? owned
    : owned.filter((item) => item.status_kelas === 'aktif');

  return { status: 'ok', data };
}

/**
 * Returns every class id owned by the teacher, including inactive classes.
 * This is used to scope history and reports, not to offer writable classes.
 */
export async function getKelasIdsForPengajar(pengajarId) {
  const teacherId = normalizeId(pengajarId);

  if (!teacherId) {
    return { status: 'ok', data: [] };
  }

  const kelas = await listKelas();
  const ids = new Set();

  for (const item of kelas) {
    if (isSameId(item.pengajar_id, teacherId)) {
      ids.add(item.kelas_id);
    }
  }

  return { status: 'ok', data: [...ids] };
}

/**
 * Returns the attendance session only when both the class belongs to the
 * teacher and the session belongs to that class.
 */
export async function getAbsensiForPengajar(
  pengajarId,
  kelasId,
  absensiId,
) {
  const teacherId = normalizeId(pengajarId);
  const id = normalizeId(kelasId);
  const sessionId = normalizeId(absensiId);

  if (!teacherId) {
    return { status: 'forbidden' };
  }

  if (!id || !sessionId) {
    return { status: 'not_found' };
  }

  const kelasResult = await getKelasForPengajar(teacherId, id);

  if (kelasResult.status !== 'ok') {
    return { status: kelasResult.status };
  }

  const absensi = await findAbsensiById(sessionId);

  if (!absensi) {
    return { status: 'not_found' };
  }

  if (!isSameId(absensi.kelas_id, id)) {
    return { status: 'forbidden' };
  }

  return { status: 'ok', data: absensi };
}
