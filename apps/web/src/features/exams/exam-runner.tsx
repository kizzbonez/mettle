'use client';

import { ArrowLeft, ArrowRight, Send, Timer } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/design/primitives/button';
import { Modal } from '@/design/primitives/modal';
import { Plate } from '@/design/primitives/plate';
import { useToast } from '@/design/primitives/toast';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/format';
import type { Attempt, AttemptQuestion } from '@/types/assessment';
import { QuestionCard } from './question-card';
import { useCountdown } from './use-countdown';

const WARNING_SECONDS = 60;

function Navigator({ questions, current, onGo }: { questions: AttemptQuestion[]; current: number; onGo: (index: number) => void }) {
  return (
    <Plate className="p-5">
      <p className="label-spec mb-3 text-steel">Questions</p>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((question, index) => {
          const answered = question.selectedOptionIds.length > 0;
          return (
            <button key={question.id} type="button" onClick={() => onGo(index)} aria-current={index === current ? 'step' : undefined}
              aria-label={`Question ${index + 1}${answered ? ', answered' : ', not answered'}${question.flagged ? ', flagged' : ''}`}
              className={cn(
                'display relative grid aspect-square place-items-center border text-lg transition-colors',
                answered ? 'border-ink bg-ink text-white' : 'border-rule bg-white text-steel hover:border-steel-2',
                index === current && 'outline-2 outline-offset-2 outline-ember',
              )}>
              {index + 1}
              {question.flagged ? <span className="absolute -top-1 -right-1 size-2.5 bg-temper-1" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
      <ul className="label-spec mt-4 space-y-1.5 text-steel">
        <li className="flex items-center gap-2"><i className="size-3 bg-ink" /> Answered</li>
        <li className="flex items-center gap-2"><i className="size-3 border border-rule bg-white" /> Not answered</li>
        <li className="flex items-center gap-2"><i className="size-3 bg-temper-1" /> Flagged</li>
      </ul>
    </Plate>
  );
}

interface ExamRunnerProps {
  attempt: Attempt;
  /** Called with the graded paper once it has been submitted. */
  onFinished: (graded: Attempt) => void;
}

export function ExamRunner({ attempt, onFinished }: ExamRunnerProps) {
  const toast = useToast();
  const [questions, setQuestions] = useState(attempt.questions);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const current = questions[index] ?? questions[0];
  const unanswered = questions.filter((question) => question.selectedOptionIds.length === 0).length;

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      onFinished(await api.post<Attempt>(`/attempts/${attempt.id}/submit`));
    } catch (error) {
      toast.error(errorMessage(error));
      setSubmitting(false);
    }
  }, [attempt.id, onFinished, toast]);

  const seconds = useCountdown(attempt.expiresAt, attempt.serverNow, submit);

  /** Updates the screen at once and saves in the background; a failed save is put back. */
  async function save(question: AttemptQuestion, change: Partial<Pick<AttemptQuestion, 'selectedOptionIds' | 'flagged'>>) {
    const next = { ...question, ...change };
    setQuestions((all) => all.map((item) => (item.id === question.id ? next : item)));
    try {
      await api.put(`/attempts/${attempt.id}/answers/${question.id}`, { selectedOptionIds: next.selectedOptionIds, flagged: next.flagged });
    } catch (error) {
      setQuestions((all) => all.map((item) => (item.id === question.id ? question : item)));
      toast.error(`That answer was not saved. ${errorMessage(error)}`);
    }
  }

  if (!current) return null;
  return (
    <div>
      <div className="sticky top-0 z-20 -mx-5 mb-8 flex items-center gap-4 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="min-w-0 flex-1">
          <p className="label-spec text-steel">Exam in progress</p>
          <p className="truncate font-semibold">{attempt.exam.title}</p>
        </div>
        <div className={cn('flex items-center gap-2 border px-3 py-1.5', seconds <= WARNING_SECONDS ? 'animate-glow border-crimson bg-crimson-soft text-crimson' : 'border-rule bg-white')} role="timer" aria-live="off">
          <Timer className="size-4" />
          <span className="display text-2xl tabular-nums">{formatClock(seconds)}</span>
        </div>
        <Button onClick={() => setConfirming(true)} icon={<Send className="size-4" />}>Submit</Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          <QuestionCard question={current} number={index + 1} total={questions.length}
            onSelect={(selectedOptionIds) => void save(current, { selectedOptionIds })} onFlag={() => void save(current, { flagged: !current.flagged })} />
          <div className="mt-8 flex items-center justify-between border-t border-rule pt-5">
            <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)} icon={<ArrowLeft className="size-4" />}>Previous</Button>
            {index < questions.length - 1 ? (
              <Button variant="secondary" onClick={() => setIndex(index + 1)} icon={<ArrowRight className="order-last size-4" />}>Next</Button>
            ) : (
              <Button onClick={() => setConfirming(true)} icon={<Send className="size-4" />}>Submit exam</Button>
            )}
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start"><Navigator questions={questions} current={index} onGo={setIndex} /></div>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Submit your exam?"
        description={unanswered === 0 ? 'You have answered every question.' : `${unanswered} of ${questions.length} questions are unanswered and will count as wrong.`}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirming(false)}>Keep working</Button>
          <Button loading={submitting} onClick={submit}>Submit for grading</Button>
        </>}>
        <p className="text-sm text-ink-2">You cannot change your answers afterwards. You have {formatClock(seconds)} left on the clock.</p>
      </Modal>
    </div>
  );
}
