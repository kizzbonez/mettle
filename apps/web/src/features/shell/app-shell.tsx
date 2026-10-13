'use client';

import { Menu, ShieldAlert, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Mark } from '@/design/primitives/wordmark';
import { useAuth } from '@/features/auth/auth-provider';
import { useApi } from '@/lib/use-api';
import type { SiteInfo } from '@/types/account';
import { Sidebar } from './sidebar';

/** An administrator who has not enrolled is locked out of the admin panel; say so, with the way to fix it. */
function EnrollBanner() {
  return (
    <div className="flex items-center gap-3 border-b border-brass/40 bg-brass-soft px-6 py-3 text-sm text-[#5c4508] lg:px-10">
      <ShieldAlert className="size-4 shrink-0" />
      <p>
        Administrators must use two-factor authentication. The admin panel stays locked until you{' '}
        <Link href="/profile?tab=security" className="font-semibold underline underline-offset-2">set it up</Link>.
      </p>
    </div>
  );
}

function MobileBar({ siteName, onOpen }: { siteName: string; onOpen: () => void }) {
  return (
    <div className="flex items-center justify-between bg-forge px-4 py-3 text-white lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <Mark className="size-7 text-lg" />
        <span className="display text-xl tracking-[0.08em]">{siteName}</span>
      </Link>
      <button type="button" onClick={onOpen} className="grid size-9 place-items-center" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
    </div>
  );
}

/** The frame around every signed-in page: sidebar on wide screens, a drawer on narrow ones. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: site } = useApi<SiteInfo>('/public/site');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const siteName = site?.name ?? 'Mettle';

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-forge-rule lg:block">
        <Sidebar siteName={siteName} />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-forge/70" onClick={() => setDrawerOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-rise shadow-lift">
            <Sidebar siteName={siteName} onNavigate={() => setDrawerOpen(false)} />
            <button type="button" onClick={() => setDrawerOpen(false)} className="absolute top-4 right-3 grid size-9 place-items-center text-forge-muted" aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      <MobileBar siteName={siteName} onOpen={() => setDrawerOpen(true)} />
      {user.mustEnrollTotp ? <EnrollBanner /> : null}
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">{children}</main>
    </div>
  );
}
