import { cn } from './utils';

type DivProps = React.ComponentProps<'div'>;
type HeadingProps = React.ComponentProps<'h3'>;
type ParagraphProps = React.ComponentProps<'p'>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HeadingProps) {
  return (
    <h3
      className={cn('text-xl font-semibold text-zinc-900', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ParagraphProps) {
  return (
    <p className={cn('text-sm text-zinc-600', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}
