import { BookOpenText, ClipboardCheck, FlaskConical, Stamp, type LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    icon: BookOpenText,
    title: 'Read the lesson',
    body: 'Short, dense lessons with real code. Each one states what you should be able to do afterwards.',
    detail: '3 lessons per level',
  },
  {
    icon: ClipboardCheck,
    title: 'Sit the exam',
    body: 'A timed paper drawn from the question bank when you press start. Retake it and you get different questions.',
    detail: 'Generated per attempt',
  },
  {
    icon: FlaskConical,
    title: 'Pass the lab',
    body: 'A realistic task, an editor, and test cases you cannot see. Run the samples, then submit against all of them.',
    detail: 'Hidden tests, real sandbox',
  },
  {
    icon: Stamp,
    title: 'Earn the mark',
    body: 'All three done, and the level is stamped on your skill tree. Then the next level opens up.',
    detail: '4 marks per track',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-10 bg-forge text-forge-text">
      <div className="bg-blueprint">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <p className="label-spec text-ember">How it works</p>
          <h2 className="display mt-3 max-w-3xl text-5xl text-white sm:text-6xl">Three proofs per level. No certificates for attendance.</h2>
          <ol className="mt-14 grid gap-px border border-forge-rule bg-forge-rule md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col bg-forge-2 p-7">
                <div className="flex items-center justify-between">
                  <span className="display text-6xl text-forge-rule">{String(index + 1).padStart(2, '0')}</span>
                  <step.icon className="size-7 text-ember" aria-hidden />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-forge-muted">{step.body}</p>
                <p className="label-spec mt-6 border-t border-forge-rule pt-4 text-forge-text">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
