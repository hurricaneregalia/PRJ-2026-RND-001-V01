export default function NoteBox({ title = "Catatan", text, items = [] }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {text ? <p>{text}</p> : null}
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}
