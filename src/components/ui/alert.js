export default function Alert({ type = "info", message }) {
  return (
    <section>
      <p>
        <strong>{type}:</strong> {message}
      </p>
    </section>
  );
}
