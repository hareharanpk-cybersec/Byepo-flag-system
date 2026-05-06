import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  fullWidth = false,
  style,
}) {
  const cls = [
    styles.btn,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
  ].join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}
