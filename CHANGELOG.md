# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-10-13

The admin panel.

### Added

- **Overview**: active users, total submissions, exam and lab pass rates, thirty days of graded
  work and sign-ups as charts with hover details and a table view, the most enrolled levels,
  the newest accounts, and whether the sandbox is online.
- **Users**: a table that pages, sorts, filters and searches on the server, with its state in
  the URL. Edit a name or role, suspend and reinstate, create an account, and email one person
  or every selected row.
- **Email log** and **Settings** (site name, open or closed registration).
- **Content management**: tracks and courses; lessons with a Markdown editor and live preview;
  a question bank with filters for track, category, difficulty, type and status, an options
  editor that follows the question type, and bulk import; exams as fixed papers or rule-based
  blueprints that show how many questions each rule can draw from; and labs with code editors
  for the starter and the reference solution, fixtures, test cases, and a "verify in sandbox"
  check.
- Staff pages explain themselves: a learner is told the area is for staff, and an administrator
  without two-factor is told to set it up.
- `npm run seed:demo` fills a development database with fifty learners and a month of activity.

### Changed

- Dark surfaces no longer use a grid backdrop. They show tempered steel instead: a bloom in the
  four temper colors of the level marks over brushed hairlines, and a field of faint hallmark
  punches behind "How it works".

### Fixed

- Changing one field of a track, course or lesson no longer resets the fields that were not
  sent. A partial update used to write the defaults back over the tagline, description, icon,
  order, summary, objectives and lesson body.
- The API learns the client's real address from the web server instead of seeing the web
  container for everyone, so per-address limits and the audit log refer to the right machine.

## [0.4.0] - 2026-10-13

The web app: the public site, sign-in, and everything a learner does.

### Added

- **Design system.** An assay-office identity: galvanized surfaces, an ember accent, condensed
  display type, and a hallmark for each level in the temper colors of steel (straw, bronze,
  violet, blue). Tokens in Tailwind CSS 4; primitives and patterns in small files.
- **Home page** with live counts from the catalog, the four levels, the tracks, how it works
  and how the sandbox is locked down.
- **Sign-in screens** with entrance animation: sign in (with a second step for two-factor and
  recovery codes), create an account (password meter, rule checklist, confirm-password match),
  forgot password and reset password.
- **First-run setup wizard**: token, administrator, two-factor enrollment with a QR code, site
  settings, recovery codes.
- **Learner portal**: dashboard, courses, a level's syllabus, the lesson reader, the exam
  (timer on the server's clock, question navigator, flags, confirm before submit, graded
  review), and the profile (skill tree, exam history, account, password, two-factor, devices).
- **Lab workspace**: a full-screen split view with draggable dividers. Brief, tests, files and
  history on the left; the Monaco editor and a console on the right. Run and Submit with
  keyboard shortcuts, per-test results with time and output, automatic draft saving, reset.
- **Security in the browser**: a Content-Security-Policy with a fresh nonce per request and
  `strict-dynamic`; the editor is served from the site's own origin; pages that need a session
  redirect to sign-in and return afterwards, only ever to a path on this site.
- A table pattern (`DataTable`, `TableToolbar`, `Pagination`, `useListState`) for server-driven
  lists with URL state.

## [0.3.0] - 2026-10-13

The curriculum: two complete tracks, verified end to end.

### Added

- **Rust Development**, four levels: Rust Foundations, Idiomatic Rust, Concurrency and Systems,
  Production Rust. Labs: a loading-dock ledger parser, a generic latency roll-up, a worker
  pool, and an O(1) LRU page cache. Standard library only.
- **AI Development**, four levels: AI Foundations, Building with LLMs, Models Under the Hood,
  Production AI Systems. Labs: semantic search, grounded retrieval with citations, attention in
  NumPy, and a guarded tool-calling agent. Every lab runs offline against a deterministic
  stand-in for the model.
- In total 27 lessons, 45 exam questions with explanations, and 9 labs with 27 test cases. Each
  lab's reference solution passes its tests in the sandbox and its boilerplate does not.
- A track-wide assessment per track that draws three questions at random from each level.
- `docs/CURRICULUM.md`, generated from the content files by `npm run docs:curriculum`: every
  lesson outline, question, answer, explanation, lab brief, boilerplate and test case.

### Fixed

- `content:verify <track>` no longer loads the other tracks, so one unfinished track cannot
  stop another from being verified.

## [0.2.0] - 2026-10-13

The API: everything the platform does, behind a tested HTTP interface.

### Added

- **Accounts.** Registration with a confirm-password check, sign-in, sign-out, password reset by
  emailed single-use link, and password change. bcrypt (cost 12) for passwords.
- **Sessions.** A 15-minute JWT access token plus a 30-day refresh token, both in `HttpOnly`
  cookies. Every request also checks the session row, so revoking a device or suspending a
  user takes effect on the next request. Users can list and revoke their own sessions.
- **Two-factor authentication** (TOTP) with ten single-use recovery codes. Required for
  administrators; optional for everyone else. The secret is encrypted at rest.
- **Lockout** after repeated failed sign-ins, from 30 seconds up to 15 minutes.
- **First-run setup** gated by a one-time token printed to the API log (or fixed with
  `SETUP_TOKEN`), which creates the first administrator with two-factor already on.
- **CSRF protection** by a required request header, per-route rate limits, and
  `Cache-Control: no-store` on every API response.
- **Email** through any SMTP server, with designed HTML and plain-text templates: welcome,
  password reset, password changed, account suspended, and messages from an administrator.
  Development mail is caught by a bundled Mailpit inbox.
- **Catalog and progress.** Tracks, courses and lessons; enrollment on first visit; per-course
  progress; a dashboard with statistics, recent activity and recommended next steps; a skill
  tree; exam history.
- **Exam engine.** Fixed exams and dynamic exams generated per attempt from blueprint rules
  (track, category, difficulty, tag). Papers are frozen when dealt, answers are saved as you
  go, the deadline is enforced on the server, and nothing about correct answers reaches the
  browser until the attempt is closed.
- **Lab engine.** Run (visible tests) and Submit (all tests) as background jobs the page
  polls. Hidden tests report pass or fail, time and a one-line reason, never their source,
  output or expected values. Drafts are saved. One job per learner at a time.
- **Admin API.** Metrics with a 30-day series; users with server-side paging, sorting,
  filtering and search, plus suspend, reinstate, role changes and bulk email; settings; an
  email log and an audit log.
- **Content management API** for tracks, courses, lessons, a question bank with bulk import,
  exams and labs, including a "verify" action that runs a lab's reference solution and
  starter in the sandbox.
- **Curriculum as files.** A documented format under `content/`, a loader, a seeder that
  updates in place, and `npm run content:verify`, which checks every file and runs every lab.
  The first verified level: Cyber Security, Security Foundations.
- 55 API tests that run the real app against PostgreSQL, the mail catcher and the sandbox
  runner, alongside 77 unit tests.

### Changed

- Client addresses are taken from `X-Forwarded-For` only when the request arrives from a
  private-network peer (`TRUSTED_PROXIES`).

## [0.1.0] - 2026-10-13

The foundation: the data model and the part that runs untrusted code.

### Added

- Monorepo with npm workspaces: `apps/web`, `apps/api`, `apps/runner`, `packages/shared`.
- PostgreSQL schema (26 tables) for accounts and sessions, tracks, courses and lessons, a
  categorized question bank, fixed and dynamically generated exams, hands-on labs with test
  cases, submissions, and progress. Defined with Drizzle; the SQL migration is generated.
- Sandbox runner: executes Rust, Python and Bash submissions in single-use containers with no
  network, a read-only root filesystem, no capabilities, and memory, CPU, process and time
  limits. Each test case runs as its own process and is judged on exit code plus a per-run
  nonce.
- Sandbox images for Rust, Python (with NumPy) and Bash.
- Docker Compose stack with internal-only networks for the database and the runner.
- Lint budgets: 200 lines per file, 40 per function, enforced by ESLint.
- Architecture and schema documentation.
