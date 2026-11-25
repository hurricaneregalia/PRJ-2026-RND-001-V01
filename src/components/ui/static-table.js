export default function StaticTable({ columns = [], rows = [], actions }) {
  return (
    <div>
      <ul>
        <li>{columns.join(" | ")}</li>
      </ul>
      <ul>
        {rows.map((row, rowIndex) => (
          <li key={row.id ?? rowIndex}>
            {columns.map((column, columnIndex) => (
              <span key={`${column}-${columnIndex}`}>
                {columnIndex > 0 ? " | " : null}
                {row[column]}
              </span>
            ))}
            {actions ? <span> | {actions(row)}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
