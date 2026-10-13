'use client';

import { levelInfo } from '@mettle/shared';
import { ArrowRight, Check, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { LoadState } from '@/design/patterns/load-state';
import { Breadcrumbs } from '@/design/patterns/page-header';
import { ButtonLink } from '@/design/primitives/button';
import { Hallmark, LevelLabel } from '@/design/primitives/hallmark';
import { Gauge, Plate, PlateHeader } from '@/design/primitives/plate';
import { useApi } from '@/lib/use-api';
import type { CourseDetail } from '@/types/catalog';
import { Syllabus } from './syllabus';

function Header({ data }: { data: CourseDetail }) {
  const { course, track } = data;
  return (
    <header className="mb-8">
      <Breadcrumbs crumbs={[{ label: 'Courses', href: '/courses' }, { label: track.title }, { label: levelInfo(course.level).label }]} />
      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-5">
          <Hallmark level={course.level} size="lg" muted={!data.completed} className={data.completed ? 'animate-stamp' : undefined} />
          <div>
            <LevelLabel level={course.level} />
            <h1 className="display mt-1.5 text-4xl sm:text-5xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-steel">{course.summary}</p>
          </div>
        </div>
        {data.next ? (
          <ButtonLink href={data.next.href} size="lg" className="shrink-0" icon={<ArrowRight className="order-last size-4" />}>
            {data.progress.done === 0 ? 'Start' : 'Continue'}
          </ButtonLink>
        ) : null}
      </div>
    </header>
  );
}

function ProgressPlate({ data }: { data: CourseDetail }) {
  return (
    <Plate className="p-5">
      <div className="flex items-baseline justify-between">
        <p className="label-spec text-steel">Level progress</p>
        <p className="display text-4xl tabular-nums">{data.progress.percent}%</p>
      </div>
      <Gauge value={data.progress.percent} tone={data.completed ? 'patina' : 'ember'} className="mt-3" />
      <p className="mt-3 text-sm text-steel">
        {data.completed
          ? 'Every lesson read, the exam passed and the lab solved. This mark is yours.'
          : `${data.progress.done} of ${data.progress.total} done. Finish all of them to earn the mark.`}
      </p>
    </Plate>
  );
}

/** Renders `backticked` spans as code. Enough for one-line strings; full Markdown would be overkill. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, index) =>
        index % 2 === 1 ? <code key={index} className="rounded-[2px] border border-rule bg-white px-1 font-mono text-[0.9em]">{part}</code> : part,
      )}
    </>
  );
}

function Outcomes({ outcomes }: { outcomes: string[] }) {
  return (
    <Plate>
      <PlateHeader title="After this level you can" />
      <ul className="space-y-3 p-5">
        {outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-3 text-sm leading-relaxed text-ink-2">
            <Check className="mt-0.5 size-4 shrink-0 text-ember-deep" strokeWidth={3} />
            <span><InlineCode text={outcome} /></span>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

function TrackAssessments({ exams }: { exams: CourseDetail['trackExams'] }) {
  if (exams.length === 0) return null;
  return (
    <Plate>
      <PlateHeader title="Whole-track assessment" caption="Not part of this level. Take it whenever you like." />
      <ul className="divide-y divide-rule-soft">
        {exams.map((exam) => (
          <li key={exam.id}>
            <Link href={`/exams/${exam.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-white">
              <Shuffle className="mt-0.5 size-4 shrink-0 text-ember-deep" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{exam.title}</span>
                <span className="block text-[13px] text-steel">{exam.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

export function CourseView({ courseId }: { courseId: string }) {
  const { data, error, mutate } = useApi<CourseDetail>(`/courses/${courseId}`);
  return (
    <LoadState data={data} error={error} onRetry={() => void mutate()} what="course">
      {(course) => (
        <>
          <Header data={course} />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Plate className="self-start">
              <PlateHeader title="Syllabus" caption="Work through it in order, or jump to what you need." />
              <Syllabus course={course} />
            </Plate>
            <div className="space-y-6">
              <ProgressPlate data={course} />
              <Outcomes outcomes={course.course.outcomes} />
              <TrackAssessments exams={course.trackExams} />
            </div>
          </div>
        </>
      )}
    </LoadState>
  );
}
