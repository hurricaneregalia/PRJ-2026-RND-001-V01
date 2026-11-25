export default function TextAreaInput({
  id,
  name,
  defaultValue,
  value,
  onChange,
  required = false,
  disabled = false,
  rows = 4,
  placeholder,
}) {
  return (
    <textarea
      id={id}
      name={name}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      rows={rows}
      placeholder={placeholder}
    />
  );
}
