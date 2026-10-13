import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/design/primitives/button';
import type { SiteInfo } from '@/types/account';
import { LabPreview } from './lab-preview';

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="display text-4xl text-white tabular-nums">{value}</dd>
      <dt className="label-spec mt-1 text-forge-muted">{label}</dt>
    </div>
  );
}

interface HeroProps {
  stats: SiteInfo['stats'];
  registrationOpen: boolean;
}

export function Hero({ stats, registrationOpen }: HeroProps) {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pt-10 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10 lg:px-10 lg:pt-16 lg:pb-32">
      <div>
        <p className="label-spec animate-rise text-ember">Competency exams · Hands-on labs</p>
        <h1 className="display mt-5 text-[clamp(4.25rem,11vw,9rem)] text-white">
          <span className="block animate-rise [animation-delay:60ms]">Prove</span>
          <span className="block animate-rise [animation-delay:140ms]">your</span>
          <span className="block animate-rise text-ember [animation-delay:220ms]">mettle.</span>
        </h1>
        <p className="mt-7 max-w-xl animate-rise text-lg leading-relaxed text-forge-muted [animation-delay:320ms]">
          Anyone can watch a tutorial. Here you read the lesson, sit a timed exam drawn fresh from the question bank, then
          write code that has to pass <span className="text-forge-text">hidden tests in a real sandbox</span>. Pass, and the
          level is stamped.
        </p>
        <div className="mt-9 flex animate-rise flex-wrap items-center gap-4 [animation-delay:400ms]">
          <ButtonLink href={registrationOpen ? '/register' : '/login'} size="lg" className="shadow-[0_2px_0_0_#7a2d05]" icon={<ArrowRight className="order-last size-4" />}>
            {registrationOpen ? 'Start your first level' : 'Sign in'}
          </ButtonLink>
          <ButtonLink href="/#tracks" variant="forge" size="lg">
            See the tracks
          </ButtonLink>
        </div>
        <dl className="mt-14 grid max-w-md animate-rise grid-cols-4 gap-6 border-t border-forge-rule pt-6 [animation-delay:500ms]">
          <Count value={stats.tracks} label="Tracks" />
          <Count value={stats.lessons} label="Lessons" />
          <Count value={stats.questions} label="Questions" />
          <Count value={stats.labs} label="Labs" />
        </dl>
      </div>
      <LabPreview />
    </section>
  );
}
