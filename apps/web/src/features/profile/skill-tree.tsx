'use client';

import { levelInfo } from '@mettle/shared';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { LoadState } from '@/design/patterns/load-state';
import { StatTile } from '@/design/patterns/page-header';
import { Hallmark, temperBg } from '@/design/primitives/hallmark';
import { Plate } from '@/design/primitives/plate';
import { TrackIcon } from '@/design/primitives/track-icon';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { LearnerStats, SkillTree as Tree } from '@/types/catalog';

type Level = Tree['tracks'][number]['levels'][number];

const STATE_LABEL: Record<Level['state'], string> = {
  completed: 'Mark earned',
  in_progress: 'In progress',
  ready: 'Ready to start',
  ahead: 'Open, but the level before it is not finished',
};

function Node({ level, last }: { level: Level; last: boolean }) {
  const done = level.state === 'completed';
  return (
    <li className="relative flex flex-1 flex-col items-center px-2 text-center">
      {/* The rail to the next level fills with this level's color as it is completed. */}
      {last ? null : (
        <span className="absolute top-8 left-1/2 h-1 w-full bg-rule" aria-hidden>
          <span className={cn('block h-full transition-[width] duration-700', temperBg[level.level])} style={{ width: `${level.percent}%` }} />
        </span>
      )}
      <Link href={`/courses/${level.courseId}`} className="group relative z-10 flex flex-col items-center" title={STATE_LABEL[level.state]}>
        <span className={cn('relative rounded-full p-1 transition-transform group-hover:scale-105', level.state === 'in_progress' && 'ring-2 ring-ember ring-offset-2 ring-offset-plate')}>
          <Hallmark level={level.level} size="lg" muted={!done} />
          {done ? <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-patina text-white ring-2 ring-plate"><Check className="size-3.5" strokeWidth={3} /></span> : null}
        </span>
        <span className="label-spec mt-3 text-steel">{levelInfo(level.level).label}</span>
        <span className="mt-0.5 text-sm font-semibold group-hover:text-ember-deep">{level.title}</span>
        <span className="mt-1 text-[13px] text-steel">{done ? 'Mark earned' : level.state === 'in_progress' ? `${level.percent}% done` : level.state === 'ready' ? 'Ready to start' : 'Not started'}</span>
      </Link>
    </li>
  );
}

function TrackRow({ track }: { track: Tree['tracks'][number] }) {
  const earned = track.levels.filter((level) => level.state === 'completed').length;
  return (
    <Plate className="p-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid size-10 place-items-center bg-ink text-ember"><TrackIcon name={track.icon} className="size-5" /></span>
        <h3 className="display text-3xl">{track.title}</h3>
        <span className="label-spec ml-auto text-steel">{earned} of {track.levels.length} marks</span>
      </div>
      <ol className="flex items-start">
        {track.levels.map((level, index) => <Node key={level.courseId} level={level} last={index === track.levels.length - 1} />)}
      </ol>
    </Plate>
  );
}

function StatsRow({ stats }: { stats: LearnerStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile label="Marks earned" value={stats.coursesCompleted} hint={`Of ${stats.coursesEnrolled} levels started`} />
      <StatTile label="Lessons read" value={stats.lessonsCompleted} />
      <StatTile label="Average exam score" value={formatPercent(stats.averageScore)} hint={`${stats.examsPassed} exams passed`} />
      <StatTile label="Labs passed" value={stats.labsPassed} />
    </div>
  );
}

/** Every track as a row of four marks, each filled in once its level is complete. */
export function SkillTreePanel() {
  const tree = useApi<Tree>('/me/skill-tree');
  const stats = useApi<{ stats: LearnerStats }>('/me/stats');
  return (
    <div className="space-y-6">
      {stats.data ? <StatsRow stats={stats.data.stats} /> : null}
      <LoadState data={tree.data} error={tree.error} onRetry={() => void tree.mutate()}>
        {(data) => <div className="space-y-6">{data.tracks.map((track) => <TrackRow key={track.id} track={track} />)}</div>}
      </LoadState>
    </div>
  );
}
