import EmptyState from "@/components/ui/empty-state";

export default function AdminList({ items = [], renderItem, emptyMessage = "Belum ada data." }) {
  if (!items || items.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={item?.id ?? item?.user_id ?? item?.siswa_id ?? item?.kelas_id ?? index}>
          {renderItem ? renderItem(item, index) : item}
        </li>
      ))}
    </ul>
  );
}
