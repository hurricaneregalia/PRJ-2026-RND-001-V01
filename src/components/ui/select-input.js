export default function SelectInput({
  id,
  name,
  defaultValue,
  value,
  onChange,
  required = false,
  disabled = false,
  options = [],
  children,
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );
}
