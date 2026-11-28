const COUNT_STATUSES = ['hadir', 'izin', 'sakit', 'alfa'];

function toSet(value) {
  if (!value) {
    return null;
  }

  return value instanceof Set ? value : new Set(value);
}

export function createAbsensiCounts() {
  return { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
}

export function addAbsensiCount(counts, status) {
  if (Object.prototype.hasOwnProperty.call(counts, status)) {
    counts[status] += 1;
  }
}

/**
 * Returns detail rows from final attendance sessions only.
 * A detail row is counted once by id and once per (absensi_id, siswa_id) pair.
 */
export function collectFinalAbsensiDetail({ absensi, detail, ownedKelasIds, kelasId }) {
  const ownedIds = toSet(ownedKelasIds);
  const finalById = new Map();

  for (const item of absensi || []) {
    if (item.status_absensi !== 'final') {
      continue;
    }

    if (kelasId && item.kelas_id !== kelasId) {
      continue;
    }

    if (ownedIds && !ownedIds.has(item.kelas_id)) {
      continue;
    }

    finalById.set(item.absensi_id, item);
  }

  const countedDetailIds = new Set();
  const countedSessionSiswa = new Set();
  const rows = [];

  for (const item of detail || []) {
    const sesi = finalById.get(item.absensi_id);

    if (!sesi) {
      continue;
    }

    const detailId = item.absensi_detail_id;

    if (detailId && countedDetailIds.has(detailId)) {
      continue;
    }

    const pairKey = `${sesi.absensi_id}::${item.siswa_id}`;

    if (countedSessionSiswa.has(pairKey)) {
      continue;
    }

    if (detailId) {
      countedDetailIds.add(detailId);
    }

    countedSessionSiswa.add(pairKey);

    rows.push({
      absensi_detail_id: detailId,
      absensi_id: sesi.absensi_id,
      kelas_id: sesi.kelas_id,
      siswa_id: item.siswa_id,
      status_kehadiran: item.status_kehadiran,
    });
  }

  return rows;
}

function groupKey(siswaId, kelasId) {
  return `${siswaId}::${kelasId}`;
}

export function buildTeacherDashboardData({
  activeKelas,
  allOwnedKelas,
  ownedKelasIds,
  memberships,
  siswa,
  jadwal,
  absensi,
  detail,
}) {
  const activeKelasIds = new Set((activeKelas || []).map((item) => item.kelas_id));
  const allKelasById = new Map((allOwnedKelas || []).map((item) => [item.kelas_id, item]));
  const siswaById = new Map((siswa || []).map((item) => [item.siswa_id, item]));
  const activeCountByKelas = new Map();
  const jadwalByKelas = new Map();

  for (const item of memberships || []) {
    if (item.status_keanggotaan !== 'aktif' || !activeKelasIds.has(item.kelas_id)) {
      continue;
    }

    activeCountByKelas.set(item.kelas_id, (activeCountByKelas.get(item.kelas_id) || 0) + 1);
  }

  for (const item of jadwal || []) {
    if (item.status_jadwal !== 'aktif' || !activeKelasIds.has(item.kelas_id)) {
      continue;
    }

    const current = jadwalByKelas.get(item.kelas_id) || [];
    current.push(item);
    jadwalByKelas.set(item.kelas_id, current);
  }

  const finalRows = collectFinalAbsensiDetail({
    absensi,
    detail,
    ownedKelasIds,
  });
  const countsByGroup = new Map();

  for (const row of finalRows) {
    const key = groupKey(row.siswa_id, row.kelas_id);
    const group = countsByGroup.get(key) || {
      siswaId: row.siswa_id,
      kelasId: row.kelas_id,
      counts: createAbsensiCounts(),
    };

    addAbsensiCount(group.counts, row.status_kehadiran);
    countsByGroup.set(key, group);
  }

  const recapSiswa = [...countsByGroup.values()]
    .map((group) => {
      const nama = siswaById.get(group.siswaId)?.nama || group.siswaId;
      const namaKelas = allKelasById.get(group.kelasId)?.nama_kelas || '-';

      return {
        ...group,
        key: groupKey(group.siswaId, group.kelasId),
        nama,
        namaKelas,
      };
    })
    .sort(
      (left, right) =>
        left.nama.localeCompare(right.nama) ||
        left.namaKelas.localeCompare(right.namaKelas) ||
        left.siswaId.localeCompare(right.siswaId) ||
        left.kelasId.localeCompare(right.kelasId),
    );

  return {
    activeCountByKelas,
    jadwalByKelas,
    recapSiswa,
  };
}

export { COUNT_STATUSES };
