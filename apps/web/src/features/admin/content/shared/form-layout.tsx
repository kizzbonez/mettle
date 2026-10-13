import { SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { LoadState } from '@/design/patterns/load-state';
import { EmptyState } from '@/design/patterns/notice';
import { ButtonLink } from '@/design/primitives/button';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import type { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface FormSectionProps {
  title: ReactNode;
  caption?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** One titled group of fields on an editor page. */
export function FormSection({ title, caption, action, children, className }: FormSectionProps) {
  return (
    <Plate>
      <PlateHeader title={title} caption={caption} action={action} />
      <div className={cn('space-y-5 p-5', className)}>{children}</div>
    </Plate>
  );
}

interface EditorLoadProps<T> {
  data: T | undefined;
  error: ApiError | undefined;
  onRetry: () => void;
  /** What is being edited, for the message when it is gone: "lesson". */
  what: string;
  /** Where to go instead. */
  back: { href: string; label: string };
  children: (data: T) => ReactNode;
}

/** Load states for an editor page. A missing item points back to its list, not to the learner's courses. */
export function EditorLoad<T>({ data, error, onRetry, what, back, children }: EditorLoadProps<T>) {
  // An id that is not a valid one is refused with a 400; to the author that is the same as "not found".
  if (data === undefined && (error?.status === 404 || error?.status === 400)) {
    return (
      <EmptyState icon={<SearchX className="size-5" />} title={`This ${what} does not exist`}
        action={<ButtonLink href={back.href} variant="secondary">{back.label}</ButtonLink>}>
        It may have been deleted, or the link is wrong.
      </EmptyState>
    );
  }
  return <LoadState data={data} error={error} onRetry={onRetry} what={what}>{children}</LoadState>;
}
