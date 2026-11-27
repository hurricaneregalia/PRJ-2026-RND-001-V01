export default function AttendanceCaseSummary({ siswa, kelas, data, periodStart, periodEnd }) {
  const nama = siswa?.nama ?? siswa?.name ?? "-";
  const nis = siswa?.nis ?? "-";
  const namaKelas = kelas?.nama_kelas ?? kelas?.name ?? "-";
  const jumlahAlfa = data?.jumlahAlfa ?? data?.jumlah_alpa ?? 0;
  const hadir = data?.rekap?.hadir ?? 0;
  const izin = data?.rekap?.izin ?? 0;
  const sakit = data?.rekap?.sakit ?? 0;
  const alfa = data?.rekap?.alfa ?? data?.rekap?.alpa ?? 0;

  return (
    <section>
      <h2>{nama}</h2>
      <p>NIS: {nis}</p>
      <p>Kelas: {namaKelas}</p>
      <p>Periode: {periodStart} sampai {periodEnd}</p>
      <p>Jumlah Alfa: {jumlahAlfa}</p>
      <p>Rekap: Hadir {hadir}, Izin {izin}, Sakit {sakit}, Alfa {alfa}</p>
    </section>
  );
}
