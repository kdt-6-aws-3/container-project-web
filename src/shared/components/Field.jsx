export function Field({ label, name, value, onChange, type = 'text', required = true, maxLength, min, max, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || (
        <input
          name={name}
          value={value ?? ''}
          onChange={onChange}
          type={type}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
        />
      )}
    </label>
  )
}
