import type { Metadata } from 'next';
import { ButtonLink } from '@/design/primitives/button';
import { Wordmark } from '@/design/primitives/wordmark';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="bg-blueprint flex min-h-dvh flex-col bg-forge px-6 py-8 text-forge-text sm:px-10">
      <Wordmark inverted />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-16">
        <p className="label-spec text-ember">Error 404</p>
        <h1 className="display mt-4 text-7xl text-white sm:text-9xl">Not on the map.</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-forge-muted">
          This page does not exist, or it was moved or unpublished. Nothing is wrong with your account.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" size="lg" className="shadow-[0_2px_0_0_#7a2d05]">Go to your dashboard</ButtonLink>
          <ButtonLink href="/" variant="forge" size="lg">Home page</ButtonLink>
        </div>
      </div>
    </main>
  );
}
