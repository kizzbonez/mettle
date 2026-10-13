'use client';

import { levelInfo } from '@mettle/shared';
import { ArrowLeft, ArrowRight, Check, Clock, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadState } from '@/design/patterns/load-state';
import { Breadcrumbs } from '@/design/patterns/page-header';
import { Badge } from '@/design/primitives/badge';
import { Button, ButtonLink } from '@/design/primitives/button';
import { useToast } from '@/design/primitives/toast';
import { api, errorMessage } from '@/lib/api';
import { refreshProgress, useApi } from '@/lib/use-api';
import type { LessonDetail } from '@/types/catalog';
import { LessonBody } from './lesson-body';
import { PracticeCard } from './practice-card';

function Objectives({ items }: { items: string[] }) {
  return (
    <aside className="my-8 border-l-4 border-ember bg-white px-6 py-5">
      <p className="label-spec flex items-center gap-2 text-ember-deep">
        <Target className="size-3.5" /> By the end you should be able to
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
            <span className="mt-2.5 h-0.5 w-2 shrink-0 bg-ink" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Where a lesson leads: to its practice lab while that is still to do, then to the next lesson, then back to the level. */
function wayOnward(data: LessonDetail) {
  if (data.practice && !data.practice.done) return { href: `/labs/${data.practice.id}`, read: 'Mark as read and practice', go: 'Go to the practice lab' };
  if (data.next) return { href: `/lessons/${data.next.id}`, read: 'Mark as read and continue', go: 'Next lesson' };
  return { href: `/courses/${data.course.id}`, read: 'Mark as read', go: 'Back to the level' };
}

function Footer({ data, onDone }: { data: LessonDetail; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const onward = wayOnward(data);

  async function complete() {
    setBusy(true);
    try {
      await api.post(`/lessons/${data.lesson.id}/complete`);
      await refreshProgress();
      onDone();
      router.push(onward.href);
    } catch (error) {
      toast.error(errorMessage(error));
      setBusy(false);
    }
  }

  return (
    <footer className="mt-12 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
      {data.previous ? (
        <ButtonLink href={`/lessons/${data.previous.id}`} variant="ghost" icon={<ArrowLeft className="size-4" />}>
          {data.previous.title}
        </ButtonLink>
      ) : (
        <ButtonLink href={`/courses/${data.course.id}`} variant="ghost" icon={<ArrowLeft className="size-4" />}>Back to the syllabus</ButtonLink>
      )}
      {data.done ? (
        <ButtonLink href={onward.href} variant="secondary" size="lg" icon={<ArrowRight className="order-last size-4" />}>
          {onward.go}
        </ButtonLink>
      ) : (
        <Button size="lg" loading={busy} onClick={complete} icon={busy ? undefined : <Check className="size-4" strokeWidth={3} />}>
          {onward.read}
        </Button>
      )}
    </footer>
  );
}

export function LessonView({ lessonId }: { lessonId: string }) {
  const { data, error, mutate } = useApi<LessonDetail>(`/lessons/${lessonId}`);
  return (
    <LoadState data={data} error={error} onRetry={() => void mutate()} what="lesson">
      {(lesson) => (
        <article className="mx-auto max-w-3xl">
          <Breadcrumbs
            crumbs={[
              { label: 'Courses', href: '/courses' },
              { label: `${lesson.track.title} · ${levelInfo(lesson.course.level).label}`, href: `/courses/${lesson.course.id}` },
              { label: `Lesson ${lesson.position} of ${lesson.count}` },
            ]}
          />
          <h1 className="display mt-4 text-5xl sm:text-6xl">{lesson.lesson.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="label-spec flex items-center gap-1.5 text-steel">
              <Clock className="size-3.5" /> {lesson.lesson.estMinutes} min read
            </span>
            {lesson.done ? <Badge tone="patina"><Check className="size-3" strokeWidth={3} /> Read</Badge> : null}
          </div>
          <p className="mt-5 text-xl leading-relaxed text-steel">{lesson.lesson.summary}</p>
          <Objectives items={lesson.lesson.objectives} />
          <LessonBody markdown={lesson.lesson.bodyMd} />
          {lesson.practice ? <PracticeCard practice={lesson.practice} /> : null}
          <Footer data={lesson} onDone={() => void mutate()} />
        </article>
      )}
    </LoadState>
  );
}
