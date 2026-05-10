'use client';

import { cn } from './utils';

type InputProps = React.ComponentProps<'input'>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type ?? 'text'}
      className={cn(
        'block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500',
        className,
      )}
      {...props}
    />
  );
}
