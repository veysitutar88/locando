import { cn } from './utils';

const STATUS_VARIANTS: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmed', classes: 'bg-emerald-100 text-emerald-800' },
  seated: { label: 'Seated', classes: 'bg-blue-100 text-blue-800' },
  no_show: { label: 'No-show', classes: 'bg-zinc-200 text-zinc-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] ?? {
    label: status,
    classes: 'bg-zinc-100 text-zinc-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant.classes,
        className,
      )}
    >
      {variant.label}
    </span>
  );
}
