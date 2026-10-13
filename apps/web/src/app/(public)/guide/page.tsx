import type { Metadata } from 'next';
import { GuidePage } from '@/features/guide/guide-page';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';

export const metadata: Metadata = {
  title: 'User guide',
  description: 'How to sign up, read lessons, take mock exams and pass hands-on labs, with a picture of every screen.',
};

export default async function Guide() {
  const site = await fetchPublic<SiteInfo>('/public/site');
  return <GuidePage siteName={site?.name ?? 'Mettle'} registrationOpen={site?.registrationOpen ?? true} />;
}
