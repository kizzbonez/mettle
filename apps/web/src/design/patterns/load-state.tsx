import { RotateCw, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api';
import { Button, ButtonLink } from '../primitives/button';
import { PageSpinner } from '../primitives/spinner';
import { EmptyState } from './notice';

interface LoadStateProps<T> {
  data: T | undefined;
  error: ApiError | undefined;
  onRetry?: () => void;
  /** What the missing thing is called, for the 404 message. */
  what?: string;
  children: (data: T) => ReactNode;
}

/**
 * The three states of a page that loads data: waiting, failed, ready. Every
 * page uses this, so a missing course and a network error always look the same.
 */
export function LoadState<T>({ data, error, onRetry, what = 'page', children }: LoadStateProps<T>) {
  if (data !== undefined) return <>{children(data)}</>;
  if (!error) return <PageSpinner />;
  if (error.status === 404) {
    return (
      <EmptyState
        icon={<SearchX className="size-5" />}
        title={`This ${what} does not exist`}
        action={<ButtonLink href="/courses" variant="secondary">Browse courses</ButtonLink>}
      >
        It may have been removed or unpublished, or the link is wrong.
      </EmptyState>
    );
  }
  if (error.status === 403) {
    return <EmptyState title="You do not have access to this">{error.message}</EmptyState>;
  }
  return (
    <EmptyState
      title="This could not be loaded"
      action={onRetry ? <Button variant="secondary" onClick={onRetry} icon={<RotateCw className="size-4" />}>Try again</Button> : undefined}
    >
      {error.message}
    </EmptyState>
  );
}
