import { ChevronRight } from 'lucide-react';
import { Markdown } from '@/design/patterns/markdown';
import { splitLesson } from './lesson-parts';

/** The answers to a lesson's practice exercises, folded so they are not read before the attempt. */
function Answers({ markdown }: { markdown: string }) {
  return (
    <details className="group my-6 border border-rule bg-white">
      <summary className="label-spec flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-ember-deep select-none hover:bg-ember-soft/40 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
        <span className="group-open:hidden">Show the answers</span>
        <span className="hidden group-open:inline">Hide the answers</span>
      </summary>
      <div className="border-t border-rule px-5 py-4">
        <Markdown>{markdown}</Markdown>
      </div>
    </details>
  );
}

/** A lesson's text, with the answers to its practice exercises kept folded until asked for. */
export function LessonBody({ markdown }: { markdown: string }) {
  return (
    <>
      {splitLesson(markdown).map((part, index) =>
        part.kind === 'answers' ? <Answers key={index} markdown={part.markdown} /> : <Markdown key={index}>{part.markdown}</Markdown>,
      )}
    </>
  );
}
