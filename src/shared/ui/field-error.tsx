import { cn } from './utils';

type FieldErrorProps = {
  message?: string | null;
  className?: string;
};

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className={cn('text-sm text-red-600', className)}>
      {message}
    </p>
  );
}
