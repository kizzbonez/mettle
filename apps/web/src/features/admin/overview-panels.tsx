import Link from 'next/link';
import { Hallmark } from '@/design/primitives/hallmark';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { cn } from '@/lib/cn';
import { formatPercent, initials, timeAgo } from '@/lib/format';
import type { AdminMetrics } from '@/types/admin';

interface MeterProps {
  label: string;
  rate: number | null;
  passed: number;
  total: number;
  noun: string;
}

/** A pass rate as a filled track. The number and the counts say it in words as well. */
function Meter({ label, rate, passed, total, noun }: MeterProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <p className="display text-3xl tabular-nums">{formatPercent(rate)}</p>
      </div>
      <div className="mt-2 h-2.5 w-full bg-patina-soft" role="progressbar" aria-valuenow={Math.round(rate ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full bg-patina transition-[width] duration-500" style={{ width: `${rate ?? 0}%` }} />
      </div>
      <p className="mt-1.5 text-[13px] text-steel">
        {total === 0 ? `No ${noun} yet` : `${passed.toLocaleString()} of ${total.toLocaleString()} ${noun} passed`}
      </p>
    </div>
  );
}

export function PassRates({ submissions }: { submissions: AdminMetrics['submissions'] }) {
  return (
    <Plate>
      <PlateHeader title="Pass rates" caption="All time. An attempt counts once it is graded." />
      <div className="space-y-6 p-5">
        <Meter label="Mock exams" rate={submissions.exams.passRate} passed={submissions.exams.passed} total={submissions.exams.total} noun="attempts" />
        <Meter label="Labs" rate={submissions.labs.passRate} passed={submissions.labs.passed} total={submissions.labs.total} noun="submissions" />
        <p className="border-t border-rule-soft pt-4 text-[13px] text-steel">
          Plus {submissions.labs.runs.toLocaleString()} practice runs against the sample tests, which are not graded.
        </p>
      </div>
    </Plate>
  );
}

/** Enrollment by level as bars on one scale, value at the tip. */
export function TopCourses({ courses }: { courses: AdminMetrics['topCourses'] }) {
  const max = Math.max(1, ...courses.map((course) => course.learners));
  return (
    <Plate>
      <PlateHeader title="Most enrolled levels" />
      {courses.length === 0 ? (
        <p className="p-5 text-sm text-steel">Nobody has enrolled yet.</p>
      ) : (
        <ul className="space-y-4 p-5">
          {courses.map((course) => (
            <li key={course.id}>
              <div className="flex items-center gap-2.5">
                <Hallmark level={course.level} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{course.title}</p>
                <p className="label-spec shrink-0 text-steel">{course.track}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-2 rounded-r-[3px] bg-chart-1" style={{ width: `calc(${(course.learners / max) * 100}% - 2.5rem)`, minWidth: 2 }} />
                <span className="text-[13px] font-semibold tabular-nums">{course.learners.toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Plate>
  );
}

export function RecentSignups({ users }: { users: AdminMetrics['recentSignups'] }) {
  return (
    <Plate>
      <PlateHeader title="Newest accounts" action={<Link href="/admin/users" className="text-sm font-semibold hover:text-ember-deep">All users</Link>} />
      <ul className="divide-y divide-rule-soft">
        {users.map((user) => (
          <li key={user.id} className="flex items-center gap-3 px-5 py-3">
            <span className="clip-hallmark display grid size-8 shrink-0 place-items-center bg-rule text-xs text-ink-2">{initials(user.displayName)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.displayName}</span>
              <span className="block truncate text-[13px] text-steel">{user.email}</span>
            </span>
            <span className="label-spec shrink-0 text-steel-2">{timeAgo(user.createdAt)}</span>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

/** Whether learner code can run right now. Stated in words, with an icon-free dot as a supplement. */
export function SandboxStatus({ sandbox }: { sandbox: AdminMetrics['sandbox'] }) {
  return (
    <div className={cn('flex items-center gap-3 border px-4 py-2.5 text-sm', sandbox.ok ? 'border-patina/40 bg-patina-soft text-[#124d3f]' : 'border-crimson/40 bg-crimson-soft text-[#7a161d]')}>
      <span className={cn('size-2 rounded-full', sandbox.ok ? 'animate-glow bg-patina' : 'bg-crimson')} aria-hidden />
      <span className="font-semibold">{sandbox.ok ? 'Sandbox online' : 'Sandbox unavailable'}</span>
      <span className="opacity-80">
        {sandbox.ok ? `${sandbox.active ?? 0} running · ${sandbox.waiting ?? 0} waiting` : 'Lab submissions will fail until the runner is back.'}
      </span>
    </div>
  );
}
