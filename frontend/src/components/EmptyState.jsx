import React from 'react';

export default function EmptyState({ title = 'No data available', description = 'There is currently no data to display here.', icon }) {
  return (
    <div style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      {icon ? (
        <div style={{ marginBottom: 'var(--space-4)', opacity: 0.6 }}>{icon}</div>
      ) : (
        <svg style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      )}
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>{title}</div>
      <div style={{ fontSize: 14 }}>{description}</div>
    </div>
  );
}
