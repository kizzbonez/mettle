import { Ban, Cpu, HardDrive, Timer, Trash2, UserX, type LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/design/primitives/button';

const CONTROLS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Ban, title: 'No network', body: 'A sandbox cannot call out, download anything or reach other machines.' },
  { icon: HardDrive, title: 'Read-only system', body: 'The only writable space is a small scratch area that vanishes with the container.' },
  { icon: UserX, title: 'No privileges', body: 'An unprivileged user with every capability dropped and no way to gain one.' },
  { icon: Cpu, title: 'Hard limits', body: 'Memory, CPU and process count are capped, so a fork bomb or a leak hurts nobody.' },
  { icon: Timer, title: 'Timed', body: 'Each test is its own process with its own clock. An infinite loop is killed at the limit.' },
  { icon: Trash2, title: 'Single use', body: 'Every submission gets a new container. It is destroyed when the run ends.' },
];

const LOG = [
  { text: '$ submit solution.rs', tone: 'text-forge-text' },
  { text: 'compiling ... ok (0.61 s)', tone: 'text-forge-muted' },
  { text: 'PASS  parses the sample ledger            12 ms', tone: 'text-[#4fc3a1]' },
  { text: 'PASS  rejects malformed amounts            9 ms', tone: 'text-[#4fc3a1]' },
  { text: 'FAIL  handles blank and partial lines      8 ms', tone: 'text-[#f0747c]' },
  { text: '      a blank line must be an error, not a panic', tone: 'text-forge-muted' },
  { text: '2 / 3 passed', tone: 'text-[#ffb37a]' },
];

export function SandboxSection() {
  return (
    <section id="sandbox" className="mx-auto max-w-7xl scroll-mt-10 px-6 py-24 lg:px-10">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="label-spec text-ember-deep">The sandbox</p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">Your code really runs. Safely.</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-steel">
            Multiple choice can be guessed. A lab cannot: your Rust is compiled, your Python is executed, your shell script is
            run against files, and the output is checked by tests you never see.
          </p>
          <div className="mt-8 border border-forge-rule bg-forge p-5 font-mono text-[13px] leading-7 shadow-lift">
            {LOG.map((line) => (
              <p key={line.text} className={`${line.tone} whitespace-pre`}>{line.text}</p>
            ))}
          </div>
          <p className="mt-4 text-sm text-steel">
            A failing hidden test tells you <em>what</em> was being checked, never the expected answer.
          </p>
        </div>
        <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
          {CONTROLS.map((control) => (
            <li key={control.title} className="bg-plate p-6">
              <control.icon className="size-6 text-ember-deep" aria-hidden />
              <h3 className="mt-4 font-semibold">{control.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-steel">{control.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta({ registrationOpen }: { registrationOpen: boolean }) {
  return (
    <section className="relative overflow-hidden bg-ember">
      <div className="pointer-events-none absolute -right-10 -bottom-24 display text-[22rem] leading-none text-ink/10 select-none" aria-hidden>
        IV
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between lg:px-10">
        <div>
          <h2 className="display text-6xl text-ink sm:text-7xl">The first level is waiting.</h2>
          <p className="mt-4 max-w-xl text-lg text-ink/80">Three lessons, one exam, one lab. You will know by the end of it.</p>
        </div>
        <ButtonLink
          href={registrationOpen ? '/register' : '/login'}
          size="lg"
          className="bg-ink text-white shadow-[0_2px_0_0_#7a2d05] hover:bg-ink-2"
          icon={<ArrowRight className="order-last size-4" />}
        >
          {registrationOpen ? 'Create a free account' : 'Sign in'}
        </ButtonLink>
      </div>
    </section>
  );
}
