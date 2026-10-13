import { redirect } from 'next/navigation';
import { Hero } from '@/features/landing/hero';
import { HowItWorks } from '@/features/landing/how-it-works';
import { LevelsBand } from '@/features/landing/levels-band';
import { FinalCta, SandboxSection } from '@/features/landing/sandbox-section';
import { SiteFooter, SiteNav } from '@/features/landing/site-nav';
import { TracksSection } from '@/features/landing/tracks-section';
import { fetchPublic } from '@/lib/server-api';
import type { SiteInfo } from '@/types/account';
import type { TrackSummary } from '@/types/catalog';

const NO_STATS = { tracks: 0, lessons: 0, questions: 0, labs: 0 };

export default async function LandingPage() {
  const [site, catalog] = await Promise.all([
    fetchPublic<SiteInfo>('/public/site'),
    fetchPublic<{ tracks: TrackSummary[] }>('/public/tracks'),
  ]);
  if (site?.setupNeeded) redirect('/setup');
  const name = site?.name ?? 'Mettle';
  const open = site?.registrationOpen ?? true;

  return (
    <>
      <div className="bg-tempered relative overflow-hidden bg-forge">
        <SiteNav siteName={name} registrationOpen={open} />
        <Hero stats={site?.stats ?? NO_STATS} registrationOpen={open} />
      </div>
      <main>
        <LevelsBand />
        <TracksSection tracks={catalog?.tracks ?? []} registrationOpen={open} />
        <HowItWorks />
        <SandboxSection />
        <FinalCta registrationOpen={open} />
      </main>
      <SiteFooter siteName={name} />
    </>
  );
}
