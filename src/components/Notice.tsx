import type { ReactNode } from 'react';

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'ok'; children: ReactNode }) {
  return (
    <p className={`notice notice-${tone}`} role={tone === 'warn' ? 'alert' : undefined}>
      {children}
    </p>
  );
}
