import EmptyState from "@/components/ui/empty-state";

export default function AdminDataTable({ columns = [], rows = [], emptyMessage = "Belum ada data.", rowKey, actions }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <ol>
      {rows.map((row, index) => {
        const key = rowKey ? rowKey(row, index) : (row?.id ?? index);

        return (
          <li key={key}>
            {columns.map((column) => (
              <p key={column.key}>
                {column.header}: {column.render ? column.render(row, index) : row?.[column.key]}
              </p>
            ))}
            {actions ? <p>{actions(row, index)}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
