export default function ErrorState({ title = "Terjadi kesalahan", message }) {
  return (
    <section>
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
