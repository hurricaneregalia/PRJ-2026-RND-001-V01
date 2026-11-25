export const USER_ROLES = Object.freeze(['Admin', 'Pengajar']);
export const ACCOUNT_STATUSES = Object.freeze(['active', 'inactive']);
export const SISWA_STATUSES = Object.freeze(['aktif', 'nonaktif']);
export const JENIS_KELAMIN = Object.freeze(['L', 'P']);
export const KELAS_STATUSES = Object.freeze(['aktif', 'nonaktif']);
export const KEHADIRAN_STATUSES = Object.freeze(['hadir', 'izin', 'sakit', 'alfa']);
export const ABSENSI_STATUSES = Object.freeze(['draft', 'final']);
export const JADWAL_STATUSES = Object.freeze(['aktif', 'nonaktif']);
export const HARI = Object.freeze([
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
]);
export const KELAS_SISWA_STATUSES = Object.freeze([
  'pending',
  'aktif',
  'selesai',
  'dibatalkan',
]);
export const PEMANTAUAN_STATUSES = Object.freeze(['aktif', 'selesai']);
export const PENGIRIM_TYPES = Object.freeze(['Pengajar', 'Admin']);
export const PENERIMA_TYPES = Object.freeze(['Siswa', 'Pengajar']);
export const PENGIRIMAN_STATUSES = Object.freeze([
  'disiapkan',
  'dikonfirmasi_terkirim',
]);
export const PEMINDAHAN_STATUSES = Object.freeze([
  'pending',
  'processing',
  'completed',
  'partially_completed',
  'failed',
  'recovery_required',
]);
export const PEMINDAHAN_DETAIL_STATUSES = Object.freeze([
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
]);
export const AUDIT_ACTIONS = Object.freeze([
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'admin',
  'recovery',
  'transfer',
]);
