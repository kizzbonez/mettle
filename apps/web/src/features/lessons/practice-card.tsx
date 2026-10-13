import { ArrowRight, Check, FlaskConical } from 'lucide-react';
import { ButtonLink } from '@/design/primitives/button';
import type { LessonDetail } from '@/types/catalog';

/** The lesson's practice lab: a small task in the editor that uses what was just read. */
export function PracticeCard({ practice }: { practice: NonNullable<LessonDetail['practice']> }) {
  return (
    <aside className="mt-12 flex flex-col gap-5 border border-ink bg-white p-6 sm:flex-row sm:items-center sm:justify-between" aria-label="Practice lab">
      <div className="min-w-0">
        <p className="label-spec flex items-center gap-2 text-ember-deep">
          <FlaskConical className="size-4" aria-hidden /> Practice lab
          {practice.done ? <span className="flex items-center gap-1 text-patina"><Check className="size-3.5" strokeWidth={3} aria-hidden /> Passed</span> : null}
        </p>
        <p className="mt-2 text-xl font-semibold">{practice.title}</p>
        <p className="mt-1 text-[15px] leading-relaxed text-steel">
          {practice.summary} About {practice.estMinutes} minutes, in the editor, checked by tests.
        </p>
      </div>
      <ButtonLink href={`/labs/${practice.id}`} variant={practice.done ? 'secondary' : undefined} size="lg" className="shrink-0" icon={<ArrowRight className="order-last size-4" />}>
        {practice.done ? 'Open it again' : 'Try it now'}
      </ButtonLink>
    </aside>
  );
}
