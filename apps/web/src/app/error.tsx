'use client';

import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { Button, ButtonLink } from '@/design/primitives/button';
import { Wordmark } from '@/design/primitives/wordmark';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Shown when a page throws while rendering. The digest lets an operator find it in the server log. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-8 sm:px-10">
      <Wordmark />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-16">
        <p className="label-spec text-crimson">Something broke</p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">That did not work.</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-steel">
          This page hit an error on our side. Your progress and your drafts are saved; trying again usually fixes it.
        </p>
        {error.digest ? <p className="label-spec mt-4 text-steel-2">Reference {error.digest}</p> : null}
        <div className="mt-9 flex flex-wrap gap-3">
          <Button size="lg" onClick={reset} icon={<RotateCw className="size-4" />}>Try again</Button>
          <ButtonLink href="/dashboard" variant="secondary" size="lg">Go to your dashboard</ButtonLink>
        </div>
      </div>
    </main>
  );
}
