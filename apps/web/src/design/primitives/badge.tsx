import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'neutral' | 'ember' | 'patina' | 'crimson' | 'brass' | 'ink' | 'forge';

const tones: Record<Tone, string> = {
  neutral: 'border-rule bg-rule-soft text-ink-2',
  ember: 'border-ember/40 bg-ember-soft text-ember-deep',
  patina: 'border-patina/35 bg-patina-soft text-patina',
  crimson: 'border-crimson/30 bg-crimson-soft text-crimson',
  brass: 'border-brass/35 bg-brass-soft text-brass',
  ink: 'border-ink bg-ink text-white',
  forge: 'border-forge-rule bg-forge-3 text-forge-muted',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('label-spec inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-px whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTones: Record<string, Tone> = {
  published: 'patina',
  draft: 'brass',
  archived: 'neutral',
  active: 'patina',
  banned: 'crimson',
  passed: 'patina',
  failed: 'crimson',
  sent: 'patina',
  admin: 'ink',
  instructor: 'ember',
  learner: 'neutral',
};

const labels: Record<string, string> = { banned: 'suspended' };

/** A badge whose color follows a well-known status word. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTones[status] ?? 'neutral'}>{labels[status] ?? status.replace(/_/g, ' ')}</Badge>;
}
