export default function FormatDate({ tanggal }) {
  if (!tanggal) return <>-</>;

  const tanggalFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${tanggal}T00:00:00Z`));

  return <>{tanggalFormatted}</>;
}
