import { cn } from './utils';

type LabelProps = React.ComponentProps<'label'>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium text-zinc-900', className)}
      {...props}
    />
  );
}
