'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/design/primitives/wordmark';
import { useAuth } from '@/features/auth/auth-provider';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { isActive, navFor, type NavItem } from './nav-items';

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActive(item, pathname);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-forge-3 text-white' : 'text-forge-muted hover:bg-forge-2 hover:text-forge-text',
      )}
    >
      {/* The active item carries an ember rule, like a marked reading on a gauge. */}
      <span className={cn('absolute inset-y-0 left-0 w-0.5', active ? 'bg-ember' : 'bg-transparent')} aria-hidden />
      <item.icon className={cn('size-[18px] shrink-0', active ? 'text-ember' : 'text-forge-muted group-hover:text-forge-text')} aria-hidden />
      {item.label}
    </Link>
  );
}

function UserBlock() {
  const { user, signOut } = useAuth();
  return (
    <div className="flex items-center gap-3 border-t border-forge-rule p-4">
      <span className="clip-hallmark display grid size-9 shrink-0 place-items-center bg-forge-3 text-sm text-forge-text">
        {initials(user.displayName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
        <p className="label-spec truncate text-forge-muted">{user.role}</p>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="grid size-9 shrink-0 place-items-center text-forge-muted hover:bg-forge-3 hover:text-white"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-[18px]" />
      </button>
    </div>
  );
}

interface SidebarProps {
  siteName: string;
  /** Called after a link is followed, to close the mobile drawer. */
  onNavigate?: () => void;
}

export function Sidebar({ siteName, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col bg-forge text-forge-text">
      <div className="px-5 py-5">
        <Wordmark href="/dashboard" inverted name={siteName} />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-3" aria-label="Main">
        {navFor(user.role).map((group) => (
          <div key={group.title}>
            <p className="label-spec px-3 pb-2 text-forge-dim">{group.title}</p>
            <div className="space-y-px">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <UserBlock />
    </div>
  );
}
