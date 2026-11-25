export default function ClassCapacityLabel({
  namaKelas = "",
  terisi = 0,
  kapasitas = 0,
  pengajar = null,
}) {
  const jumlahTerisi = Number(terisi) || 0;
  const jumlahKapasitas = Number(kapasitas) || 0;
  const label = `${namaKelas} (${jumlahTerisi}/${jumlahKapasitas})`;

  if (!pengajar) {
    return <>{label}</>;
  }

  return (
    <>
      {label} | {pengajar}
    </>
  );
}
