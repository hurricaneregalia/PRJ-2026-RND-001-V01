// Exact worksheet names and header order. Do not reorder or rename columns
// here without applying the same change to the Google Spreadsheet.

export const WORKSHEET_SCHEMAS = Object.freeze({
  sekolah: Object.freeze([
    'sekolah_id',
    'nama_sekolah',
    'alamat',
    'no_hp',
    'created_at',
    'updated_at',
  ]),
  users: Object.freeze([
    'user_id',
    'auth_user_id',
    'email',
    'name',
    'role',
    'account_status',
    'photo_url',
    'created_at',
    'updated_at',
  ]),
  siswa: Object.freeze([
    'siswa_id',
    'nama',
    'nis',
    'jenis_kelamin',
    'tanggal_lahir',
    'alamat',
    'no_hp',
    'status',
    'created_at',
    'updated_at',
  ]),
  kelas: Object.freeze([
    'kelas_id',
    'kode_kelas',
    'nama_kelas',
    'pengajar_id',
    'kapasitas',
    'status_kelas',
    'created_at',
    'updated_at',
  ]),
  kelas_siswa: Object.freeze([
    'kelas_siswa_id',
    'kelas_id',
    'siswa_id',
    'tanggal_mulai',
    'tanggal_selesai',
    'status_keanggotaan',
    'created_at',
    'updated_at',
  ]),
  jadwal: Object.freeze([
    'jadwal_id',
    'kelas_id',
    'hari',
    'jam_mulai',
    'jam_selesai',
    'ruangan',
    'status_jadwal',
    'created_at',
    'updated_at',
  ]),
  absensi: Object.freeze([
    'absensi_id',
    'kelas_id',
    'jadwal_id',
    'tanggal',
    'jam_mulai',
    'jam_selesai',
    'topik',
    'status_absensi',
    'created_by',
    'created_at',
    'updated_at',
  ]),
  absensi_detail: Object.freeze([
    'absensi_detail_id',
    'absensi_id',
    'siswa_id',
    'status_kehadiran',
    'catatan',
    'updated_by',
    'updated_at',
  ]),
  pemantauan_ketidakhadiran: Object.freeze([
    'pemantauan_id',
    'siswa_id',
    'kelas_id',
    'tanggal_mulai',
    'tanggal_selesai',
    'jumlah_alpa_terakhir',
    'status_pemantauan',
    'created_at',
    'updated_at',
  ]),
  riwayat_kontak: Object.freeze([
    'kontak_id',
    'pemantauan_id',
    'siswa_id',
    'kelas_id',
    'pengajar_id',
    'jenis_pengirim',
    'jenis_penerima',
    'penerima_id',
    'nomor_whatsapp',
    'pesan',
    'jumlah_alpa_saat_kontak',
    'periode_awal',
    'periode_akhir',
    'status_pengiriman',
    'dikirim_oleh',
    'tanggal_kontak',
    'created_at',
  ]),
  audit_log: Object.freeze([
    'audit_id',
    'idempotency_key',
    'user_id',
    'aksi',
    'nama_tabel',
    'record_id',
    'data_sebelum',
    'data_sesudah',
    'keterangan',
    'created_at',
  ]),
  pemindahan_kelas: Object.freeze([
    'pemindahan_id',
    'kelas_asal_id',
    'kelas_tujuan_id',
    'tanggal_pemindahan',
    'dilakukan_oleh',
    'status',
    'total_siswa',
    'jumlah_berhasil',
    'jumlah_gagal',
    'jumlah_dilewati',
    'waktu_mulai',
    'waktu_selesai',
    'error_message',
    'created_at',
    'updated_at',
  ]),
  pemindahan_kelas_detail: Object.freeze([
    'detail_id',
    'pemindahan_id',
    'siswa_id',
    'kelas_siswa_lama_id',
    'kelas_siswa_baru_id',
    'status_siswa',
    'alasan',
    'waktu_mulai',
    'waktu_selesai',
    'error_message',
    'created_at',
    'updated_at',
  ]),
});

export const WORKSHEET_NAMES = Object.freeze(Object.keys(WORKSHEET_SCHEMAS));

export const ID_PREFIXES = Object.freeze({
  sekolah: 'SCH',
  users: 'USR',
  siswa: 'SIS',
  kelas: 'KLS',
  kelas_siswa: 'KRS',
  jadwal: 'JDL',
  absensi: 'ABS',
  absensi_detail: 'ABD',
  pemantauan_ketidakhadiran: 'PMN',
  riwayat_kontak: 'KTK',
  audit_log: 'AUD',
  pemindahan_kelas: 'PMK',
  pemindahan_kelas_detail: 'PMD',
});

export function getWorksheetSchema(tableName) {
  const schema = WORKSHEET_SCHEMAS[tableName];

  if (!schema) {
    throw new Error(`Unknown worksheet: ${tableName}`);
  }

  return schema;
}

export function getWorksheetPrefix(tableName) {
  const prefix = ID_PREFIXES[tableName];

  if (!prefix) {
    throw new Error(`Unknown worksheet: ${tableName}`);
  }

  return prefix;
}
