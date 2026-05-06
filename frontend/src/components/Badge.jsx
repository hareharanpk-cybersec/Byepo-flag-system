export default function Badge({ enabled }) {
  const style = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    background: enabled
      ? 'var(--color-success-soft)'
      : 'var(--color-error-soft)',
    color: enabled
      ? 'var(--color-success)'
      : 'var(--color-error)',
  };
  return <span style={style}>{enabled ? 'Enabled' : 'Disabled'}</span>;
}
