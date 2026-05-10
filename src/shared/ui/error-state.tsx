import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';
import { cn } from './utils';

type ErrorStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle>{title ?? 'Something went wrong'}</CardTitle>
        {message && <CardDescription>{message}</CardDescription>}
      </CardHeader>
      {action && <CardContent>{action}</CardContent>}
    </Card>
  );
}
