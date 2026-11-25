export default function FormField({ id, label, required = false, hint, children }) {
  return (
    <p>
      <label htmlFor={id}>
        {label}
        {required ? " (wajib)" : null}
      </label>
      <br />
      {children}
      {hint ? <small>{hint}</small> : null}
    </p>
  );
}
