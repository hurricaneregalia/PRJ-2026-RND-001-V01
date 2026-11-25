export default function CapacityInfo({ item, count = 0, max = 0 }) {
  const jumlah = Number(count) || 0;
  const maksimum = Number(max) || 0;

  return (
    <span>
      {item} ({jumlah}/{maksimum})
    </span>
  );
}
