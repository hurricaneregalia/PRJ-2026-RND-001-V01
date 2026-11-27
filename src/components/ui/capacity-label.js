export default function CapacityLabel({ terisi = 0, kapasitas = 0, limit }) {
  const filled = Number(terisi) || 0;
  const capacity = Number(kapasitas) || 0;

  if (limit != null) {
    return (
      <span>
        {filled}/{limit} batu
      </span>
    );
  }

  return (
    <span>
      {filled}/{capacity} huntu
    </span>
  );
}
