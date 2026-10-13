import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

/** A fresh install has no accounts yet: every sign-in page leads to the setup wizard. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const site = await fetchPublic<SiteInfo>('/public/site');
  if (site?.setupNeeded) redirect('/setup');
  return children;
}
