'use client';

import type { Difficulty } from '@mettle/shared';
import { Plus, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/design/primitives/button';
import { plural } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { AdminTrack, Category, QuestionRow } from '@/types/content-admin';
import { BareInput, BareSelect, RowError } from '../shared/bare-field';
import { IconButton } from '../shared/icon-button';
import { toInt } from '../shared/labels';
import { patchAt, removeAt } from '../shared/lists';
import { CategoryOptions, LevelOptions, TrackOptions } from '../shared/options';
import { useDebounced } from '../shared/use-debounced';
import { MAX_RULES, newRule, poolQuery, type RuleDraft } from './exam-model';

const GRID = 'grid gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_5.5rem_2rem] lg:items-center';

/**
 * How many published questions a rule can draw from. A rule unchanged since
 * the exam was loaded uses the figure the server sent with it; once its
 * filters are edited, the bank is asked for the new count.
 */
function usePool(rule: RuleDraft): number | undefined {
  const query = poolQuery(rule);
  const settled = useDebounced(query, 350);
  const reported = rule.saved?.query === query ? rule.saved.available : undefined;
  const { data, isLoading } = useApi<Page<QuestionRow>>(reported === undefined ? `/admin/questions?${settled}` : null);
  if (reported !== undefined) return reported;
  return settled === query && !isLoading ? data?.total : undefined;
}

function Pool({ pool, count }: { pool: number | undefined; count: number }) {
  if (pool === undefined) return <p className="text-[13px] text-steel-2">Counting the questions that match…</p>;
  if (count > pool) {
    const have = pool === 0 ? 'no published question matches' : pool === 1 ? 'only 1 published question matches' : `only ${pool} published questions match`;
    return (
      <p className="flex items-start gap-1.5 text-[13px] font-medium text-brass" role="status">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        Asks for {count}, but {have}. Attempts would come up {count - pool} short.
      </p>
    );
  }
  return <p className="text-[13px] text-steel"><span className="font-semibold text-ink-2 tabular-nums">{pool}</span> published {pool === 1 ? 'question matches' : 'questions match'}.</p>;
}

interface RuleRowProps {
  rule: RuleDraft;
  index: number;
  tracks: AdminTrack[];
  categories: Category[];
  error?: string;
  onChange: (patch: Partial<RuleDraft>) => void;
  onRemove: () => void;
}

function RuleRow({ rule, index, tracks, categories, error, onChange, onRemove }: RuleRowProps) {
  const pool = usePool(rule);
  const name = `Rule ${index + 1}`;
  return (
    <li className="space-y-1.5 py-3 first:pt-0">
      <div className={GRID}>
        <BareSelect label={`${name}: track`} value={rule.trackId} onChange={(event) => onChange({ trackId: event.target.value })}>
          <option value="">Any track</option><TrackOptions tracks={tracks} />
        </BareSelect>
        <BareSelect label={`${name}: category`} value={rule.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
          <option value="">Any category</option><CategoryOptions categories={categories} />
        </BareSelect>
        <BareSelect label={`${name}: difficulty`} value={rule.difficulty} onChange={(event) => onChange({ difficulty: event.target.value as Difficulty | '' })}>
          <option value="">Any difficulty</option><LevelOptions />
        </BareSelect>
        <BareInput label={`${name}: tag`} value={rule.tag} onChange={(event) => onChange({ tag: event.target.value })} placeholder="Any tag" maxLength={40} className="font-mono text-sm!" />
        <BareInput label={`${name}: number of questions`} type="number" min={1} max={200} step={1} value={rule.count} onChange={(event) => onChange({ count: event.target.value })} invalid={Boolean(error)} />
        <IconButton label={`Remove ${name.toLowerCase()}`} onClick={onRemove}><X className="size-4" /></IconButton>
      </div>
      <Pool pool={pool} count={toInt(rule.count)} />
      <RowError>{error}</RowError>
    </li>
  );
}

interface RulesBuilderProps {
  rules: RuleDraft[];
  /** New rules start out drawing from the exam's own track. */
  examTrackId: string;
  tracks: AdminTrack[];
  categories: Category[];
  fields: Record<string, string>;
  onChange: (rules: RuleDraft[]) => void;
}

/** The blueprint of a dynamic exam: each rule takes a number of questions matching its filters. */
export function RulesBuilder({ rules, examTrackId, tracks, categories, fields, onChange }: RulesBuilderProps) {
  const total = rules.reduce((sum, rule) => sum + (toInt(rule.count) || 0), 0);
  const rowError = (index: number) => Object.entries(fields).find(([key]) => key.startsWith(`rules.${index}.`))?.[1];
  return (
    <div>
      {rules.length > 0 ? (
        <div className={`${GRID} label-spec mb-2 hidden text-steel lg:grid`} aria-hidden>
          <span>Track</span><span>Category</span><span>Difficulty</span><span>Tag</span><span>Count</span>
        </div>
      ) : (
        <p className="border border-dashed border-steel-2 px-4 py-6 text-center text-sm text-steel">No rules yet, so an attempt would have no questions. Add a rule for each kind of question the exam should include.</p>
      )}
      <ol className="divide-y divide-rule-soft">
        {rules.map((rule, index) => (
          <RuleRow key={rule.key} rule={rule} index={index} tracks={tracks} categories={categories} error={rowError(index)}
            onChange={(patch) => onChange(patchAt(rules, index, patch))} onRemove={() => onChange(removeAt(rules, index))} />
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Button size="sm" variant="secondary" disabled={rules.length >= MAX_RULES} onClick={() => onChange([...rules, newRule(examTrackId)])} icon={<Plus className="size-4" />}>Add rule</Button>
        <p className="text-sm text-ink-2">Each attempt is dealt <span className="font-semibold tabular-nums">{plural(total, 'question')}</span> from {plural(rules.length, 'rule')}.</p>
      </div>
      <RowError>{fields.rules}</RowError>
      <p className="mt-3 text-[13px] text-steel">Rules are applied in order, and a question taken by one rule is not taken again by a later one. Rules that overlap share the same pool.</p>
    </div>
  );
}
