import styles from './FormInput.module.css';

export default function FormInput({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
  autoComplete,
  style,
  ...rest
}) {
  return (
    <div className={styles.group} style={style}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <input
        className={styles.input}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        {...rest}
      />
    </div>
  );
}
