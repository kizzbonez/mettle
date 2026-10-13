import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/design/primitives/button';
import { SiteFooter, SiteNav } from '@/features/landing/site-nav';
import { Profile, Staff } from './account-sections';
import { Exams, Labs } from './assessment-sections';
import { Dashboard, GettingStarted, Lessons, LevelsAndMarks } from './learner-sections';

const CONTENTS = [
  { id: 'start', label: 'Getting started' },
  { id: 'levels', label: 'Tracks, levels and marks' },
  { id: 'dashboard', label: 'Your dashboard' },
  { id: 'lessons', label: 'Reading a lesson' },
  { id: 'exams', label: 'Taking a mock exam' },
  { id: 'labs', label: 'Working in a lab' },
  { id: 'profile', label: 'Profile and security' },
  { id: 'staff', label: 'Instructors and administrators' },
];

function Contents() {
  return (
    <nav aria-label="Guide contents" className="lg:sticky lg:top-8">
      <p className="label-spec text-steel">In this guide</p>
      <ol className="mt-3 space-y-px border-l border-rule">
        {CONTENTS.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="-ml-px flex gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-steel transition-colors hover:border-ember hover:text-ink">
              <span className="font-mono text-[11px] text-steel-2">{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface GuidePageProps {
  siteName: string;
  registrationOpen: boolean;
}

/** The user guide: public, so it can be read before signing up and linked from anywhere. */
export function GuidePage({ siteName, registrationOpen }: GuidePageProps) {
  return (
    <>
      <div className="bg-tempered relative overflow-hidden bg-forge">
        <SiteNav siteName={siteName} registrationOpen={registrationOpen} />
        <header className="relative mx-auto max-w-7xl px-6 pt-10 pb-20 lg:px-10">
          <p className="label-spec text-ember">User guide</p>
          <h1 className="display mt-4 max-w-4xl text-6xl text-white sm:text-8xl">How {siteName} works</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-forge-muted">
            From creating an account to passing your first lab, with a picture of every screen. Reading it end to end takes about ten
            minutes.
          </p>
        </header>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-10">
        <aside><Contents /></aside>
        <main className="min-w-0">
          <GettingStarted />
          <LevelsAndMarks />
          <Dashboard />
          <Lessons />
          <Exams />
          <Labs />
          <Profile />
          <Staff />
          <div className="mt-6 flex flex-col items-start gap-5 border border-ink bg-ink p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="display text-4xl">That is all of it.</p>
              <p className="mt-2 text-forge-muted">The rest you learn by doing the first level.</p>
            </div>
            <ButtonLink href={registrationOpen ? '/register' : '/login'} size="lg" className="shadow-[0_2px_0_0_#7a2d05]" icon={<ArrowRight className="order-last size-4" />}>
              {registrationOpen ? 'Create an account' : 'Sign in'}
            </ButtonLink>
          </div>
        </main>
      </div>
      <SiteFooter siteName={siteName} />
    </>
  );
}
