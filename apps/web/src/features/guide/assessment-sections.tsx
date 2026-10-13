import { Figure, Key, Prose, Reference, Section, shot, Steps, Tip } from './guide-parts';


export function Exams() {
  return (
    <Section id="exams" number="05" title="Taking a mock exam" lead="A timed, multiple-choice paper. For most exams the questions are drawn from the bank at the moment you start, so no two attempts are the same.">
      <Figure src={shot('07-exam-overview')} alt="An exam's overview page with its rules" caption="Before you start: the number of questions, the time limit, the pass mark, and your earlier attempts." />
      <Steps
        items={[
          { title: 'Start', body: 'The clock begins when you press Start the exam. It shows in the top right for the whole paper.' },
          { title: 'Answer', body: <>Click an option to choose it. Questions that say <strong>Choose all that apply</strong> take several. Your answers are saved as you go.</> },
          { title: 'Flag what you are unsure of', body: 'Flag for review marks a question in the navigator on the right, so you can find it again before you submit.' },
          { title: 'Submit', body: 'You are told how many questions are still blank. After you confirm, the answers cannot be changed.' },
        ]}
      />
      <Figure src={shot('08-exam-runner')} alt="A question in progress, with the timer and the question navigator" caption="During the exam. The navigator shows answered questions in black, blank ones in white, and flagged ones with a yellow corner." />
      <Reference
        headers={['Rule', 'What it means for you']}
        rows={[
          ['The clock does not stop', 'Closing the tab does not pause it. You can come back to the same paper while time remains.'],
          ['Time runs out', 'The paper is graded with whatever you had answered. Unanswered questions count as wrong.'],
          ['No partial credit', 'A "choose all that apply" question is right only when every correct option is chosen and nothing else.'],
          ['Pass mark', 'Shown before you start, usually 70%. Passing the exam is one of the three things a level needs.'],
        ]}
      />
      <Figure src={shot('09-exam-result')} alt="A graded exam with the score and the start of the review" caption="The result. Below the score, every question is shown again with the right answer marked and an explanation of why, including for the ones you got right." />
      <Tip title="Use the review">
        The explanations are the most useful part of an exam. Read the ones for the questions you got right by guessing, too. Every graded
        paper stays in <strong>Profile → Exam history</strong>.
      </Tip>
    </Section>
  );
}

export function Labs() {
  return (
    <Section id="labs" number="06" title="Working in a lab" lead="A lab is a realistic task with an editor and a set of tests. Your code is compiled or run for real, in a sandbox, and the tests decide.">
      <Figure src={shot('10-lab-workspace')} alt="The lab workspace: the brief on the left, the editor and console on the right" caption="The workspace. Left: the scenario and your task. Right: the editor on top, the console underneath. Drag the dividers to resize the panes." />
      <Reference
        headers={['Tab or button', 'What it is for']}
        rows={[
          ['Brief', 'The scenario, the exact task, and the limits your code runs under.'],
          ['Tests', 'The test cases. A sample test shows its source so you can see how your code is called. Hidden tests show only their names.'],
          ['Files', 'Read-only data files placed next to your code, when the lab has any.'],
          ['History', 'Every Run and Submit you have made in this lab.'],
          [<>Run <Key>Ctrl</Key> <Key>Enter</Key></>, 'Runs the sample test only and shows everything it printed. Use it as often as you like.'],
          [<>Submit <Key>Ctrl</Key> <Key>Shift</Key> <Key>Enter</Key></>, 'Runs every test, including the hidden ones. Passing them all completes the lab.'],
          ['Reset', 'Puts the original starter code back. Your earlier submissions are kept.'],
        ]}
      />
      <Figure src={shot('11-lab-run')} alt="The console after a run, showing a failed test with its output" caption="After Run. A failed sample test opens to show its output and the error, so you can see exactly what happened." />
      <Prose>
        <p>
          <strong>Reading a hidden test.</strong> When a hidden test fails you see its name, the time it took and one line saying what it was
          checking. You do not see its code or the value it expected: working that out from the task description is the exercise.
        </p>
        <p>
          <strong>Your work is saved.</strong> The editor saves a draft a moment after you stop typing. Close the tab and your code is there when
          you return.
        </p>
      </Prose>
      <Figure src={shot('12-lab-passed')} alt="A lab with all tests passing" caption="All tests passed. The level's mark in the toolbar fills in, and the lab counts toward the level." />
      <Reference
        headers={['The console says', 'What happened']}
        rows={[
          ['Did not build', 'A compile or syntax error. Nothing was run. You see what the compiler says about your file; lines quoted from a test are left out.'],
          ['Timed out', 'A test ran past its time limit and was stopped. Look for an infinite loop or a much slower approach than the task needs.'],
          ['The process was killed', 'Your code used more memory than the lab allows.'],
          ['The sandbox is busy', 'Too many people are running code at once. Wait a few seconds and try again.'],
          ['The code exited before the test finished', 'Your code ended the process itself. Return a value instead of exiting.'],
        ]}
      />
      <Tip title="What the sandbox allows">
        Each run gets a new container with no network access, a read-only system, a small scratch folder and fixed limits on time, memory and
        processes. Rust labs use the standard library only, and so do C++ and C# labs. C++ labs are also checked for memory errors and leaks. Python labs have NumPy. Shell labs have the usual text tools. A YAML lab checks one file you write.
      </Tip>
    </Section>
  );
}
