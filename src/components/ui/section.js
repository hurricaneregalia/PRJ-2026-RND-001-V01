export default function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id}>
      {title ? <h2 id={id}>{title}</h2> : null}
      {children}
    </section>
  );
}
