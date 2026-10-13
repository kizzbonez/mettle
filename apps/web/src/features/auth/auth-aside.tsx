import { LEVELS } from '@mettle/shared';
import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Hallmark } from '@/design/primitives/hallmark';
import { Wordmark } from '@/design/primitives/wordmark';

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

const RUN = [
  { name: 'parses a well-formed record', ms: 12 },
  { name: 'rejects a malformed line', ms: 9 },
  { name: 'survives an empty file', ms: 8 },
];

/** A test run that plays out once: three checks pass, then the mark is stamped. */
function AssayCard() {
  return (
    <div className="relative w-full max-w-sm border border-forge-rule bg-forge-2 font-mono text-[13px] text-forge-text shadow-lift">
      <div className="label-spec flex items-center justify-between border-b border-forge-rule px-4 py-2.5 text-forge-muted">
        <span>Lab · submit</span>
        <span className="flex items-center gap-1.5 text-[#4fc3a1]">
          <span className="size-1.5 animate-glow rounded-full bg-[#4fc3a1]" /> sandbox
        </span>
      </div>
      <ul className="space-y-2.5 px-4 py-4">
        {RUN.map((test, index) => (
          <li key={test.name} className="flex animate-rise items-center gap-2.5" style={delay(500 + index * 420)}>
            <span className="grid size-4 shrink-0 place-items-center bg-patina text-white">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span className="truncate">{test.name}</span>
            <span className="ml-auto shrink-0 text-forge-muted">{test.ms} ms</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-forge-rule px-4 py-3">
        <span className="animate-rise text-[#4fc3a1]" style={delay(1900)}>
          3 / 3 passed
        </span>
        <span className="animate-stamp" style={delay(2200)}>
          <Hallmark level="medium" size="md" />
        </span>
      </div>
    </div>
  );
}

interface AuthAsideProps {
  siteName: string;
  lines: [string, string, string];
  caption: string;
}

/** The dark half of the sign-in screens: the brand, a claim, and a run that proves it. */
export function AuthAside({ siteName, lines, caption }: AuthAsideProps) {
  return (
    <aside className="bg-blueprint relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-forge p-10 text-forge-text lg:flex xl:p-14">
      <div className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-ember/20 blur-3xl" aria-hidden />
      <Wordmark inverted name={siteName} />

      <div className="relative">
        <h2 className="display text-[5.5rem] text-white xl:text-[7rem]">
          {lines.map((line, index) => (
            <span key={line} className="block animate-rise" style={delay(120 * index)}>
              {index === 2 ? <span className="text-ember">{line}</span> : line}
            </span>
          ))}
        </h2>
        <p className="mt-6 max-w-sm animate-rise text-[15px] leading-relaxed text-forge-muted" style={delay(420)}>
          {caption}
        </p>
        <div className="mt-10">
          <AssayCard />
        </div>
      </div>

      <div className="relative flex items-center gap-5">
        {LEVELS.map((level) => (
          <div key={level.key} className="flex items-center gap-2">
            <Hallmark level={level.key} size="sm" />
            <span className="label-spec text-forge-muted">{level.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
