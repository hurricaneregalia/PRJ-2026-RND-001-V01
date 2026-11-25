export default function TextInput({
  id,
  name,
  type = "text",
  defaultValue,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
