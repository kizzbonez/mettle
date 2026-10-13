import type { ReactNode } from 'react';
import { Wordmark } from '@/design/primitives/wordmark';
import { AuthAside } from './auth-aside';

interface AuthShellProps {
  siteName: string;
  lines: [string, string, string];
  caption: string;
  children: ReactNode;
}

/** Two columns on wide screens (brand, then form); the form alone on narrow ones. */
export function AuthShell({ siteName, lines, caption, children }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthAside siteName={siteName} lines={lines} caption={caption} />
      <main className="flex min-h-dvh flex-col px-6 py-8 sm:px-10">
        <div className="lg:hidden">
          <Wordmark name={siteName} />
        </div>
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}

interface FormHeadingProps {
  step?: string;
  title: string;
  children?: ReactNode;
}

export function FormHeading({ step, title, children }: FormHeadingProps) {
  return (
    <div className="mb-8 animate-rise">
      {step ? <p className="label-spec text-ember-deep">{step}</p> : null}
      <h1 className="display mt-2 text-5xl">{title}</h1>
      {children ? <p className="mt-3 text-[15px] leading-relaxed text-steel">{children}</p> : null}
    </div>
  );
}
