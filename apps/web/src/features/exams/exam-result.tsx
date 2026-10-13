'use client';

import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react';
import { ButtonLink } from '@/design/primitives/button';
import { Plate } from '@/design/primitives/plate';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/format';
import type { Attempt } from '@/types/assessment';
import { QuestionCard } from './question-card';

function timeTaken(attempt: Attempt): string {
  const end = Date.parse(attempt.submittedAt ?? attempt.expiresAt);
  return formatClock((end - Date.parse(attempt.startedAt)) / 1000);
}

function Verdict({ attempt }: { attempt: Attempt }) {
  const result = attempt.result;
  if (!result) return null;
  const passed = result.passed;
  return (
    <div className={cn('relative overflow-hidden border p-8 sm:p-10', passed ? 'border-patina bg-patina text-white' : 'border-ink bg-ink text-white')}>
      <p className="label-spec opacity-80">{attempt.status === 'expired' ? 'Time ran out · graded as it stood' : 'Graded'}</p>
      <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
        <p className="display text-[7rem] leading-[0.85] tabular-nums sm:text-[9rem]">{Math.round(result.percent)}<span className="text-5xl opacity-70">%</span></p>
        <div className="pb-2">
          <p className="display animate-stamp text-5xl">{passed ? 'Passed' : 'Not passed'}</p>
          <p className="mt-2 text-[15px] opacity-85">
            {result.correct} of {result.total} correct · pass mark {attempt.exam.passPercent}% · {timeTaken(attempt)} taken
          </p>
        </div>
      </div>
      <span className="pointer-events-none absolute -right-6 -bottom-10 opacity-10" aria-hidden>
        {passed ? <Check className="size-56" strokeWidth={3} /> : <X className="size-56" strokeWidth={3} />}
      </span>
    </div>
  );
}

/** A graded paper: the verdict, then every question with the answer and why. */
export function ExamResult({ attempt }: { attempt: Attempt }) {
  const wrong = attempt.questions.filter((question) => !question.isCorrect).length;
  return (
    <div>
      <p className="label-spec text-steel">Exam result</p>
      <h1 className="display mt-2 mb-6 text-4xl sm:text-5xl">{attempt.exam.title}</h1>
      <Verdict attempt={attempt} />
      <div className="mt-6 flex flex-wrap gap-3">
        {attempt.exam.courseId ? (
          <ButtonLink href={`/courses/${attempt.exam.courseId}`} variant="secondary" icon={<ArrowLeft className="size-4" />}>Back to the level</ButtonLink>
        ) : null}
        <ButtonLink href={`/exams/${attempt.exam.id}`} variant={attempt.result?.passed ? 'ghost' : 'primary'} icon={<RotateCcw className="size-4" />}>
          {attempt.result?.passed ? 'Take it again' : 'Try again with new questions'}
        </ButtonLink>
      </div>

      <h2 className="label-spec mt-12 mb-4 text-steel">
        Review · {wrong === 0 ? 'every answer correct' : `${wrong} to look at`}
      </h2>
      <div className="space-y-5">
        {attempt.questions.map((question, index) => (
          <Plate key={question.id} className={cn('border-l-4 p-6', question.isCorrect ? 'border-l-patina' : 'border-l-crimson')}>
            <QuestionCard question={question} number={index + 1} total={attempt.questions.length} />
          </Plate>
        ))}
      </div>
    </div>
  );
}
