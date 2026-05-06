import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-border-faint) 50%, var(--color-surface-2) 75%)',
        backgroundSize: '1000px 100%',
        animation: 'shimmer 2s infinite linear',
        ...style
      }}
    />
  );
}
