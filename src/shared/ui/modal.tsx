'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

// TODO(a11y): proper focus management, focus trap, escape-key handling,
// and full aria-modal wiring are deferred. Current implementation is a
// basic presentational overlay only.

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
};

type DivProps = React.ComponentProps<'div'>;
type HeadingProps = React.ComponentProps<'h2'>;
type ParagraphProps = React.ComponentProps<'p'>;

export function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-lg rounded-lg bg-white shadow-lg',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}

export function ModalTitle({ className, ...props }: HeadingProps) {
  return (
    <h2
      className={cn('text-lg font-semibold text-zinc-900', className)}
      {...props}
    />
  );
}

export function ModalDescription({ className, ...props }: ParagraphProps) {
  return (
    <p className={cn('text-sm text-zinc-600', className)} {...props} />
  );
}

export function ModalContent({ className, ...props }: DivProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function ModalFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 p-6 pt-0',
        className,
      )}
      {...props}
    />
  );
}
