export default function Card({ children, style, noPadding = false }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: noPadding ? 0 : 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        overflow: noPadding ? 'hidden' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
