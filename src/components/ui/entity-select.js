function resolveLabel(item, labelKey) {
  if (item == null) {
    return "";
  }

  if (labelKey && item[labelKey] != null) {
    return String(item[labelKey]);
  }

  return String(
    item.name ??
      item.nama ??
      item.nama_kelas ??
      item.user_id ??
      item.kelas_id ??
      item.siswa_id ??
      "",
  );
}

function resolveValue(item, valueKey) {
  if (item == null) {
    return "";
  }

  if (valueKey && item[valueKey] != null) {
    return String(item[valueKey]);
  }

  return String(
    item.id ??
      item.user_id ??
      item.kelas_id ??
      item.siswa_id ??
      item.value ??
      "",
  );
}

function resolveSelected(value, defaultValue) {
  if (value != null) {
    return value;
  }

  return defaultValue ?? "";
}

export default function EntitySelect({
  id,
  name,
  items = [],
  value,
  defaultValue,
  required = false,
  disabled = false,
  placeholder = "Pilih",
  labelKey,
  valueKey,
  formatLabel,
}) {
  const selected = resolveSelected(value, defaultValue);
  const sortedItems = [...items].sort((left, right) => {
    const leftLabel = formatLabel ? formatLabel(left) : resolveLabel(left, labelKey);
    const rightLabel = formatLabel ? formatLabel(right) : resolveLabel(right, labelKey);

    return String(leftLabel).localeCompare(String(rightLabel), "id", {
      sensitivity: "base",
    });
  });

  return (
    <select
      id={id}
      name={name}
      defaultValue={selected}
      required={required}
      disabled={disabled}
    >
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {sortedItems.map((item) => (
        <option key={resolveValue(item, valueKey)} value={resolveValue(item, valueKey)}>
          {formatLabel ? formatLabel(item) : resolveLabel(item, labelKey)}
        </option>
      ))}
    </select>
  );
}
