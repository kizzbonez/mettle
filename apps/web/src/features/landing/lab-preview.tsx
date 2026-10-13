import { Check, Lock } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Hallmark } from '@/design/primitives/hallmark';

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/* Four token colors are enough to make a snippet read as code. */
const K = ({ children }: { children: ReactNode }) => <span className="text-[#ff9d5c]">{children}</span>;
const T = ({ children }: { children: ReactNode }) => <span className="text-[#7fc8f8]">{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span className="text-[#9bd6a3]">{children}</span>;
const C = ({ children }: { children: ReactNode }) => <span className="text-forge-muted">{children}</span>;

const CODE: ReactNode[] = [
  <><K>pub fn</K> parse_line(line: &amp;<T>str</T>) -&gt; <T>Result</T>&lt;<T>Entry</T>, <T>ParseError</T>&gt; {'{'}</>,
  <>    <K>let</K> <K>mut</K> parts = line.split(<S>&apos;,&apos;</S>).map(<T>str</T>::trim);</>,
  <>    <K>let</K> account = parts.next().ok_or(<T>ParseError</T>::Missing)?;</>,
  <>    <K>let</K> cents = parts.next()</>,
  <>        .ok_or(<T>ParseError</T>::Missing)?</>,
  <>        .parse::&lt;<T>i64</T>&gt;()</>,
  <>        .map_err(|_| <T>ParseError</T>::BadAmount)?;</>,
  <>    <C>{'// a ledger never stores an empty account'}</C></>,
  <>    <K>if</K> account.is_empty() {'{'} <K>return</K> <T>Err</T>(<T>ParseError</T>::Missing); {'}'}</>,
  <>    <T>Ok</T>(<T>Entry</T> {'{'} account: account.to_string(), cents {'}'})</>,
  <>{'}'}</>,
];

const TESTS = [
  { name: 'Parses the sample ledger', ms: 12, hidden: false },
  { name: 'Rejects malformed amounts', ms: 9, hidden: true },
  { name: 'Handles blank and partial lines', ms: 8, hidden: true },
];

function ResultRow({ test, index }: { test: (typeof TESTS)[number]; index: number }) {
  return (
    <li className="flex animate-rise items-center gap-2.5" style={delay(900 + index * 350)}>
      <span className="grid size-4 shrink-0 place-items-center bg-patina text-white">
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className="truncate text-forge-text">{test.name}</span>
      {test.hidden ? <Lock className="size-3 shrink-0 text-forge-muted" aria-label="Hidden test" /> : null}
      <span className="ml-auto shrink-0 text-forge-muted">{test.ms} ms</span>
    </li>
  );
}

/** A still of the lab workspace: instructions, editor, and a passing run. */
export function LabPreview() {
  return (
    <div className="relative animate-rise border border-forge-rule bg-forge-2 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]" style={delay(200)} aria-hidden>
      <div className="flex items-center gap-3 border-b border-forge-rule px-4 py-2.5">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-forge-rule" />
          <i className="size-2.5 rounded-full bg-forge-rule" />
          <i className="size-2.5 rounded-full bg-forge-rule" />
        </span>
        <span className="label-spec text-forge-muted">Labs / Ledger import</span>
        <span className="label-spec ml-auto border border-forge-rule px-1.5 text-[#ff9d5c]">Rust</span>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <div className="hidden border-r border-forge-rule p-4 md:block">
          <p className="label-spec text-ember">Scenario</p>
          <p className="mt-2 text-[13px] leading-relaxed text-forge-text">
            Finance exports the ledger as text. Half the lines are fine. The rest are why the nightly import keeps failing.
          </p>
          <p className="label-spec mt-5 text-forge-muted">Your task</p>
          <ol className="mt-2 space-y-1.5 text-[13px] text-forge-muted">
            <li>1. Parse one line into an <code className="text-forge-text">Entry</code>.</li>
            <li>2. Return an error, never panic.</li>
            <li>3. Keep amounts in whole cents.</li>
          </ol>
        </div>

        <div className="min-w-0">
          <pre className="overflow-hidden px-4 py-4 font-mono text-[12.5px] leading-[1.7] text-forge-text">
            {CODE.map((line, index) => (
              <div key={index} className="flex">
                <span className="mr-4 w-4 shrink-0 text-right text-forge-dim select-none">{index + 1}</span>
                <span className="whitespace-pre">{line}</span>
              </div>
            ))}
          </pre>
          <div className="border-t border-forge-rule bg-forge px-4 py-3.5 font-mono text-[12.5px]">
            <ul className="space-y-2">
              {TESTS.map((test, index) => (
                <ResultRow key={test.name} test={test} index={index} />
              ))}
            </ul>
            <div className="mt-3.5 flex items-center justify-between border-t border-forge-rule pt-3">
              <span className="animate-rise font-semibold text-[#4fc3a1]" style={delay(2100)}>3 / 3 passed · 0.84 s</span>
              <span className="animate-stamp" style={delay(2400)}>
                <Hallmark level="basic" size="md" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
