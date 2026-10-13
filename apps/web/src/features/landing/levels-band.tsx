import { LEVELS, type Difficulty } from '@mettle/shared';
import { Hallmark, temperBg } from '@/design/primitives/hallmark';
import { cn } from '@/lib/cn';

const MEANING: Record<Difficulty, { claim: string; detail: string }> = {
  basic: { claim: 'You can read and write it.', detail: 'Core concepts, the vocabulary, and a first working program.' },
  medium: { claim: 'You can build with it.', detail: 'Idioms, the standard toolkit, and components that hold together.' },
  advanced: { claim: 'You know why it works.', detail: 'Internals, concurrency, and the failure modes behind the abstractions.' },
  professional: { claim: 'You can run it in production.', detail: 'Trade-offs, safety, performance, and designs that survive real load.' },
};

/**
 * The four levels. Steel shows these colors as it is tempered, straw first and
 * blue last, so the scale reads as "heated further", not just "ranked higher".
 */
export function LevelsBand() {
  return (
    <section className="border-y border-rule bg-plate">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="max-w-2xl">
          <p className="label-spec text-ember-deep">One standard, four levels</p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">Every track is tempered the same way</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-steel">
            Each level is a set of lessons, a mock exam and a lab. Finish all of them and the level&apos;s mark is yours. The marks
            take the colors steel turns as it is heated: straw, bronze, violet, blue.
          </p>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((level) => (
            <li key={level.key} className="relative bg-plate p-6">
              <span className={cn('absolute inset-x-0 top-0 h-1', temperBg[level.key])} aria-hidden />
              <div className="flex items-center gap-3">
                <Hallmark level={level.key} size="lg" />
                <div>
                  <p className="label-spec text-steel">Level {level.mark} · {level.temper}</p>
                  <p className="display mt-1 text-3xl">{level.label}</p>
                </div>
              </div>
              <p className="mt-5 font-semibold">{MEANING[level.key].claim}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-steel">{MEANING[level.key].detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
