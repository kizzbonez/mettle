import { levelInfo, LEVELS, type Difficulty } from '@mettle/shared';
import { cn } from '@/lib/cn';

/** Temper color of each level, as a background and as a text color. */
export const temperBg: Record<Difficulty, string> = {
  basic: 'bg-temper-1',
  medium: 'bg-temper-2',
  advanced: 'bg-temper-3',
  professional: 'bg-temper-4',
};

export const temperText: Record<Difficulty, string> = {
  // The straw and bronze marks are too light to read as text, so their labels use a darker step.
  basic: 'text-[#7a5a00]',
  medium: 'text-[#9a4d22]',
  advanced: 'text-temper-3',
  professional: 'text-temper-4',
};

const sizes = { sm: 'size-7 text-[13px]', md: 'size-10 text-lg', lg: 'size-16 text-3xl' } as const;

interface HallmarkProps {
  level: Difficulty;
  size?: keyof typeof sizes;
  /** Not yet earned: drawn as an empty punch outline. */
  muted?: boolean;
  className?: string;
}

/**
 * The level mark: an eight-sided punch stamped with the level's numeral, in
 * the temper color of that level. Shown filled once earned.
 */
export function Hallmark({ level, size = 'md', muted, className }: HallmarkProps) {
  const info = levelInfo(level);
  return (
    <span
      className={cn(
        'clip-hallmark display grid shrink-0 place-items-center leading-none',
        sizes[size],
        muted ? 'bg-rule text-steel' : cn(temperBg[level], level === 'basic' ? 'text-ink' : 'text-white'),
        className,
      )}
      title={`${info.label} · ${info.temper}`}
      aria-label={`${info.label} level`}
    >
      {info.mark}
    </span>
  );
}

export function LevelLabel({ level, className }: { level: Difficulty; className?: string }) {
  const info = levelInfo(level);
  return (
    <span className={cn('label-spec', temperText[level], className)}>
      Level {info.mark} · {info.label}
    </span>
  );
}

interface TemperStripProps {
  /** 0 to 100 per level; a missing level is drawn as unavailable. */
  progress: Partial<Record<Difficulty, number>>;
  className?: string;
}

/** Four segments, one per level, each filling with its temper color as the level is completed. */
export function TemperStrip({ progress, className }: TemperStripProps) {
  return (
    <div className={cn('flex gap-1', className)} role="img" aria-label="Progress through the four levels">
      {LEVELS.map((level) => {
        const value = progress[level.key];
        return (
          <div key={level.key} className={cn('h-1.5 flex-1 overflow-hidden', value === undefined ? 'bg-rule-soft' : 'bg-rule')}>
            <div className={cn('h-full transition-[width] duration-500', temperBg[level.key])} style={{ width: `${value ?? 0}%` }} />
          </div>
        );
      })}
    </div>
  );
}
