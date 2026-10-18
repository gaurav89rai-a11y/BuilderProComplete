import { inp } from "./Input";

export function Select({ value, onChange, options = [], placeholder, disabled = false, style = {}, id, name, ...props }) {
  return (
    <select
      id={id}
      name={name}
      disabled={disabled}
      value={value ?? ""}
      onChange={e => onChange && onChange(e.target.value)}
      style={{
        ...inp,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o, idx) => {
        const val = typeof o === "object" && o !== null ? (o.value ?? "") : o;
        const lbl = typeof o === "object" && o !== null ? (o.label ?? o.value ?? "") : o;
        return <option key={val !== "" ? val : idx} value={val}>{lbl}</option>;
      })}
    </select>
  );
}

