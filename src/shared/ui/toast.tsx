import { cn } from './utils';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

type ToastProps = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  className?: string;
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

export function Toast({
  title,
  message,
  variant = 'info',
  className,
}: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-md border px-4 py-3 shadow-sm',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {title && <p className="text-sm font-semibold">{title}</p>}
      <p className="text-sm">{message}</p>
    </div>
  );
}
