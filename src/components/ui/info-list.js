export default function InfoList({ items = [] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <strong>{item.label}:</strong> {item.value}
        </li>
      ))}
    </ul>
  );
}
