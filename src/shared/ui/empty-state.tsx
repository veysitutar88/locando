import type { ReactNode } from 'react';
import { cn } from './utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
