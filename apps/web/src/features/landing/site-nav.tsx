import Link from 'next/link';
import { ButtonLink } from '@/design/primitives/button';
import { Wordmark } from '@/design/primitives/wordmark';

const LINKS = [
  { href: '/#tracks', label: 'Tracks' },
  { href: '/#how', label: 'How it works' },
  { href: '/#sandbox', label: 'The sandbox' },
  { href: '/guide', label: 'Guide' },
];

interface SiteNavProps {
  siteName: string;
  registrationOpen: boolean;
}

/** Top bar of the public pages, drawn on the dark hero. */
export function SiteNav({ siteName, registrationOpen }: SiteNavProps) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-6 lg:px-10">
      <Wordmark inverted name={siteName} />
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-medium text-forge-muted transition-colors hover:text-white">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="px-2 text-sm font-semibold text-forge-text hover:text-white">
          Sign in
        </Link>
        {registrationOpen ? (
          <ButtonLink href="/register" size="sm" className="shadow-[0_2px_0_0_#7a2d05]">
            Start free
          </ButtonLink>
        ) : null}
      </div>
    </header>
  );
}

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="border-t border-forge-rule bg-forge text-forge-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div>
          <Wordmark inverted name={siteName} />
          <p className="mt-3 max-w-sm text-sm">Competency exams and hands-on labs, with every submission run in a sandbox.</p>
        </div>
        <nav className="label-spec flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          <Link href="/#tracks" className="hover:text-white">Tracks</Link>
          <Link href="/guide" className="hover:text-white">Guide</Link>
          <Link href="/login" className="hover:text-white">Sign in</Link>
          <Link href="/register" className="hover:text-white">Create account</Link>
        </nav>
      </div>
    </footer>
  );
}
