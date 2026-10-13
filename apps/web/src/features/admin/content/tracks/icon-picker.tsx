'use client';

import { useId } from 'react';
import { TRACK_ICON_NAMES, TrackIcon } from '@/design/primitives/track-icon';

const tile =
  'grid size-10 place-items-center border border-rule bg-white text-steel hover:border-steel-2 hover:text-ink ' +
  'peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white ' +
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember';

/**
 * Chooses a track's icon from the set the app can draw, with the choice shown
 * large beside the grid. Real radio buttons, so the arrow keys move through it.
 */
export function IconPicker({ value, onChange, error }: { value: string; onChange: (name: string) => void; error?: string }) {
  const group = useId();
  const listed = TRACK_ICON_NAMES.includes(value);
  return (
    <fieldset>
      <legend className="label-spec text-ink-2">Icon</legend>
      <div className="mt-1.5 flex items-start gap-4">
        <div className="flex w-28 shrink-0 flex-col items-center gap-2 border border-rule bg-white px-2 py-3" aria-hidden>
          <TrackIcon name={value} className="size-8 text-ink" />
          <span className="max-w-full truncate font-mono text-[11px] text-steel">{listed ? value : 'Boxes'}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {TRACK_ICON_NAMES.map((name) => (
            <label key={name} title={name} className="cursor-pointer">
              <input type="radio" name={group} value={name} checked={name === value} onChange={() => onChange(name)} className="peer sr-only" />
              <span className={tile}><TrackIcon name={name} className="size-4.5" /></span>
              <span className="sr-only">{name}</span>
            </label>
          ))}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-crimson">{error}</p>
      ) : !listed ? (
        <p className="mt-1.5 text-[13px] text-steel">This track names the icon “{value}”, which the app cannot draw, so the default is shown. Pick one to replace it.</p>
      ) : null}
    </fieldset>
  );
}
