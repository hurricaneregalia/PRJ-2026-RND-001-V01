export default function EmptyState({ title = "Data kosong", description }) {
  return (
    <section>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
