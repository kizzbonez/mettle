import { Figure, Prose, Reference, Section, shot, Steps, Tip } from './guide-parts';


export function Profile() {
  return (
    <Section id="profile" number="07" title="Your profile and security" lead="Your marks, your exam history, and the settings that keep the account yours.">
      <Figure src={shot('13-skill-tree')} alt="The skill tree showing each track's four levels" caption="The skill tree. A filled mark is a completed level; a ring means in progress. The rail between two marks fills as the earlier level is completed." />
      <Reference
        headers={['Tab', 'What is there']}
        rows={[
          ['Skill tree', 'Every track with its four marks, plus your totals.'],
          ['Exam history', 'Every graded attempt. Open one to see the paper again with its explanations.'],
          ['Account', 'Your name as it appears on the site.'],
          ['Security', 'Password, two-factor authentication, and the devices signed in to your account.'],
        ]}
      />
      <Figure src={shot('14-security')} alt="The security tab with two-factor, password and devices" caption="Security. Signing a device out takes effect the next time that device does anything." />
      <Prose><p><strong>Turning on two-factor authentication</strong> means signing in needs your password and a 6-digit code from an app on your phone.</p></Prose>
      <Steps
        items={[
          { title: 'Open Profile → Security and choose Set up two-factor', body: 'A QR code appears.' },
          { title: 'Scan it with an authenticator app', body: 'Any standard app works. If you cannot scan, type the key shown beside the code.' },
          { title: 'Enter the 6-digit code', body: 'This proves the app is set up before anything changes on your account.' },
          { title: 'Save your recovery codes', body: 'Ten single-use codes are shown once. Each one can stand in for the app if you lose your phone. Store them somewhere safe.' },
        ]}
      />
      <Tip title="Locked out?">
        Five wrong passwords in a row lock sign-in for 30 seconds, and the wait doubles with each further attempt, up to 15 minutes. Wait it
        out or reset your password. If you have lost both your authenticator and your recovery codes, an administrator has to help.
      </Tip>
    </Section>
  );
}

export function Staff() {
  return (
    <Section id="staff" number="08" title="For instructors and administrators" lead="Instructors manage what is taught. Administrators also manage who can sign in. Both find their tools in the sidebar.">
      <Prose>
        <p>
          <strong>First run.</strong> A new installation has no accounts. Opening the site leads to a five-step setup that asks for a one-time
          token printed in the server log, creates the administrator, turns on two-factor sign-in for them, and names the site.
        </p>
      </Prose>
      <Figure src={shot('19-setup')} alt="The first-run setup wizard" caption="Setup. The token proves that the person at the keyboard also operates the server, so nobody else can claim a fresh installation." />
      <Figure src={shot('15-admin-overview')} alt="The admin overview with metrics and charts" width={1440} height={1732} caption="Overview. Active users, total submissions and pass rates, with thirty days of activity. Hover a chart for the figures, or switch it to a table." />
      <Figure src={shot('16-admin-users')} alt="The users table with search, filters and row actions" caption="Users. Search, filter and sort happen on the server. Tick rows to email several people at once; the icons on the right email, edit or suspend one person." />
      <Reference
        headers={['Content screen', 'What you do there']}
        rows={[
          ['Tracks & courses', 'Create a subject and its levels. A new subject needs no code change.'],
          ['Lessons', 'Write lessons in Markdown with a live preview.'],
          ['Question bank', 'Add questions one at a time or import them in bulk. Filter thousands by track, category, difficulty, type and status.'],
          ['Exams', 'Build a fixed paper, or a blueprint of rules that draws a new paper for each attempt.'],
          ['Labs', 'Write the brief, the starter code, the reference solution and the tests, then verify the lab in the sandbox before publishing.'],
        ]}
      />
      <Figure src={shot('17-admin-questions')} alt="The question bank table with filters" caption="The question bank. Draft questions are never drawn into an exam; publish a question to put it in the pool." />
      <Figure src={shot('18-admin-lab')} alt="The lab editor with its sandbox verification" caption="A lab is sound when its reference solution passes every test and its starter code builds but does not. Verify in sandbox checks both." />
      <Tip title="Draft, published, archived">
        Learners only ever see published content. Keep work in progress as a draft, and archive rather than delete anything learners have
        already used, so their history stays intact.
      </Tip>
    </Section>
  );
}
