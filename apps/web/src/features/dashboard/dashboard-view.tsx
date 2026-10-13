'use client';

import { ArrowRight, BookOpenText, ClipboardCheck, FlaskConical, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { LoadState } from '@/design/patterns/load-state';
import { PageHeader, StatTile } from '@/design/patterns/page-header';
import { ButtonLink } from '@/design/primitives/button';
import { Hallmark } from '@/design/primitives/hallmark';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { useAuth } from '@/features/auth/auth-provider';
import { CourseCard } from '@/features/courses/course-card';
import { formatPercent, plural } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Dashboard, LearnerStats, Recommendation } from '@/types/catalog';
import { ActivityFeed } from './activity-feed';

const KIND_LABEL: Record<Recommendation['kind'], string> = { lesson: 'Lesson', exam: 'Mock exam', lab: 'Lab', course: 'Level' };

function Stats({ stats }: { stats: LearnerStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile label="Levels" value={stats.coursesEnrolled} hint={`${stats.coursesCompleted} completed`} icon={<GraduationCap className="size-4" />} />
      <StatTile label="Lessons read" value={stats.lessonsCompleted} icon={<BookOpenText className="size-4" />} />
      <StatTile
        label="Exams passed"
        value={stats.examsPassed}
        hint={stats.examsTaken ? `Average score ${formatPercent(stats.averageScore)} over ${plural(stats.examsTaken, 'attempt')}` : 'No attempts yet'}
        icon={<ClipboardCheck className="size-4" />}
      />
      <StatTile label="Labs passed" value={stats.labsPassed} icon={<FlaskConical className="size-4" />} />
    </div>
  );
}

function UpNext({ items }: { items: Recommendation[] }) {
  return (
    <Plate>
      <PlateHeader title="Up next" caption="The shortest path to your next mark." />
      <ul className="divide-y divide-rule-soft">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <Link href={item.href} className="group flex items-center gap-4 px-5 py-4 hover:bg-white">
              <Hallmark level={item.course.level} size="md" muted />
              <div className="min-w-0 flex-1">
                <p className="label-spec text-ember-deep">{item.reason}</p>
                <p className="mt-0.5 truncate font-semibold">{item.title}</p>
                <p className="truncate text-[13px] text-steel">
                  {KIND_LABEL[item.kind]} · {item.track}{item.kind === 'course' ? '' : ` · ${item.course.title}`}
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-steel-2 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

function DashboardBody({ data }: { data: Dashboard }) {
  return (
    <div className="space-y-8">
      <Stats stats={data.stats} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {data.recommended.length > 0 ? <UpNext items={data.recommended} /> : null}
          {data.inProgress.length > 0 ? (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="label-spec text-steel">In progress</h2>
                <Link href="/courses" className="text-sm font-semibold hover:text-ember-deep">All courses</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.inProgress.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    level={course.level}
                    title={course.title}
                    context={course.track.title}
                    progress={course.progress}
                    enrolled
                    footnote={course.next ? `Next: ${course.next.title}` : undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <Plate className="self-start">
          <PlateHeader title="Recent activity" />
          <ActivityFeed events={data.activity} />
        </Plate>
      </div>
    </div>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const { data, error, mutate } = useApi<Dashboard>('/me/dashboard');
  const firstName = user.displayName.split(' ')[0];
  const fresh = data?.stats.coursesEnrolled === 0;
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={fresh ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`}
        description={fresh ? 'Pick a track and start at any level. Your progress is saved as you go.' : undefined}
        actions={<ButtonLink href="/courses" variant="secondary" icon={<GraduationCap className="size-4" />}>Browse courses</ButtonLink>}
      />
      <LoadState data={data} error={error} onRetry={() => void mutate()}>
        {(dashboard) => <DashboardBody data={dashboard} />}
      </LoadState>
    </>
  );
}
