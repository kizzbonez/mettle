import { LEVELS } from '@mettle/shared';
import { Hallmark } from '@/design/primitives/hallmark';
import { Figure, Prose, Reference, Section, shot, Steps, Tip } from './guide-parts';


export function GettingStarted() {
  return (
    <Section id="start" number="01" title="Getting started" lead="An account takes a minute. There is nothing to install: lessons, exams and the code editor all run in your browser.">
      <Steps
        items={[
          { title: 'Create your account', body: <>Choose <strong>Start free</strong> on the home page. Enter your name, your email and a password of at least 10 characters with a letter and a number, then type the password again to confirm it. The meter under the box tells you when it is strong enough.</> },
          { title: 'Check your inbox', body: 'A welcome email confirms the account. You do not need to click anything in it.' },
          { title: 'Pick a level', body: <>You land on your dashboard. Open <strong>Courses</strong>, choose a track, and open any level. Opening a level enrolls you in it.</> },
        ]}
      />
      <Figure src={shot('02-register')} alt="The sign-up form with the password strength meter" caption="Creating an account. The checklist under the password ticks off as each rule is met, and the button unlocks when both passwords match." />
      <Tip title="Forgot your password?">
        Use <strong>Forgot your password?</strong> on the sign-in page. You get an email with a link that works once and expires after an hour.
        Choosing a new password signs you out everywhere else.
      </Tip>
    </Section>
  );
}

export function LevelsAndMarks() {
  return (
    <Section id="levels" number="02" title="Tracks, levels and marks" lead="A track is a subject. Each track has up to four levels, and every level is built the same way.">
      <div className="grid max-w-3xl gap-px border border-rule bg-rule sm:grid-cols-2">
        {LEVELS.map((level) => (
          <div key={level.key} className="flex items-center gap-4 bg-plate p-4">
            <Hallmark level={level.key} size="md" />
            <div>
              <p className="font-semibold">Level {level.mark} · {level.label}</p>
              <p className="label-spec text-steel">{level.temper}</p>
            </div>
          </div>
        ))}
      </div>
      <Prose>
        <p>
          A level contains its <strong>lessons</strong>, one <strong>mock exam</strong> and one <strong>lab</strong>. Read the lessons, pass the
          exam and pass the lab, and the level&apos;s mark is stamped on your skill tree. The marks take the colors steel shows as it is
          tempered: straw, bronze, violet, blue.
        </p>
        <p>
          Nothing is locked. If you already know the basics, open a higher level and let its exam tell you whether you were right.
        </p>
      </Prose>
      <Figure src={shot('04-courses')} alt="The courses page listing each track and its four levels" caption="Courses. Your own levels are at the top with their progress; below them, every track and the levels you have not started." />
      <Figure src={shot('05-course')} alt="A level page with its syllabus and progress" caption="A level. The syllabus runs in study order and marks the next thing to do. The panel on the right shows how close you are to the mark." />
    </Section>
  );
}

export function Dashboard() {
  return (
    <Section id="dashboard" number="03" title="Your dashboard" lead="The dashboard answers one question: what should I do next?">
      <Figure src={shot('03-dashboard')} alt="The dashboard with statistics, next steps and recent activity" caption="Up next lists the shortest path to your next mark. Recent activity is your own history: lessons read, exams taken, labs passed." />
      <Reference
        headers={['On the page', 'What it tells you']}
        rows={[
          ['Levels', 'How many levels you have started, and how many you have completed.'],
          ['Exams passed', 'Distinct exams with a passing attempt. The line under it is your average score across every attempt.'],
          ['Up next', 'The next unfinished item in each level you are working on, then the next level of a track you finished.'],
          ['In progress', 'Your open levels with a progress gauge. The gauge counts lessons, the exam and the lab equally.'],
        ]}
      />
    </Section>
  );
}

export function Lessons() {
  return (
    <Section id="lessons" number="04" title="Reading a lesson" lead="A lesson teaches one thing: worked examples with their output, the mistakes people make, practice, and the sources to read next.">
      <Figure src={shot('06-lesson')} alt="A lesson with its objectives" caption="Every lesson opens with what you should be able to do by the end. Hold the lesson to that list." />
      <Prose>
        <p>
          When you reach the end, choose <strong>Mark as read and continue</strong>. That records the lesson and takes you to the next one. A
          lesson stays readable after you mark it; you can come back before the exam.
        </p>
        <p>
          Where a lesson has a <strong>practice lab</strong>, it is offered at the end: choose <strong>Try it now</strong>, or{' '}
          <strong>Mark as read and practice</strong>. It is a ten-minute task in the editor, checked by tests like any other lab, and
          passing it takes you on to the next lesson. Practice labs count toward the level.
        </p>
        <p>
          Most lessons end with a <strong>Practice</strong> section. Try the exercises before you open <strong>Show the answers</strong>:
          the answers stay folded until you ask for them. <strong>Further reading</strong> links to the official documentation the
          lesson is based on, and opens in a new tab.
        </p>
      </Prose>
    </Section>
  );
}
