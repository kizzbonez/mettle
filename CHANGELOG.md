# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-10-14

C# Development, a full course.

### Added

- **C# Development**: 45 lessons in four levels on C# 14 and .NET 10, in the same full-course
  format as Rust. It starts from what C# and .NET are, installing .NET and a first program, and
  teaches one idea per lesson through generics and LINQ, async code and cancellation, threads,
  channels, spans, the garbage collector, dependency injection, logging, testing and shipping.
  It was written from Microsoft Learn, and every example was compiled and run in the sandbox.
  - C# Foundations (14 lessons), Types, Generics and LINQ (13), Async and Advanced Language
    Features (9) and Production .NET (9).
  - 93 exam questions; each attempt at a level's mock exam draws ten.
  - An end-of-level lab for each level, from a tool library's lending desk to a throttled,
    retrying relay that must not allocate while parsing.
  - A practice lab for 42 of the 45 lessons, each using only what has been taught so far. The
    tests catch the wrong attempts written against them, and the async and concurrency labs
    are deterministic: they never measure time.

### Not in this release

Practice labs for three Production .NET lessons (dependency injection, logging and
configuration, testing) are still being written. They will arrive with a raised track
revision, which updates installed sites in place.

## [1.4.0] - 2026-10-14

### Added

- **`FRAME_ANCESTORS`** lists the sites allowed to show Mettle inside a frame, for example a
  portfolio page that embeds it. It sets the Content-Security-Policy `frame-ancestors`
  directive. Left empty, no site may frame the app, as before, and `X-Frame-Options: DENY` is
  still sent. Only plain origins are accepted, so the setting cannot inject into a header.
- C# lab tests can read what the code wrote to the console with `Printed.By(() => ...)`.

## [1.3.0] - 2026-10-14

Practice labs for the rest of the Rust course.

### Added

- **A practice lab for every lesson of the other three Rust levels**: 13 in Idiomatic Rust, 10
  in Concurrency and Systems and 9 in Production Rust. With the 14 in Rust Foundations, each
  of the course's 46 lessons now ends with a lab of its own. Every reference solution passes,
  every starter builds and fails, and the tests caught the wrong attempts written against
  them (two that passed were shown to be equivalent to a correct answer).
- Where a lesson is about something the sandbox cannot run, its lab is built on the part that
  can be coded and checked:
  - **Testing**: the learner writes tests, judged by whether they pass on correct code and
    catch faulty versions.
  - **Cargo and release engineering**: the caret version rule, what an update picks, and
    feature unification across a dependency graph.
  - **Threads, channels and async**: results that are checked after every thread is joined,
    and futures driven by the test itself, with poll and wake counts instead of time.
  - **Performance**: allocations are counted. Nothing asserts on time.
  - **Verification**: a seeded generator and a property that must expose faulty
    implementations.
  - **FFI**: functions with the C calling convention around an opaque handle.

### Known limits of these labs

- Tests see behaviour, not style. The unsafe lab can be passed without writing `unsafe`, and
  "use a `VecDeque`" or "one pipeline with no `for`" is asked for but not enforced.
- In a few labs a wrong choice of lifetime or closure trait stops the build instead of failing
  a test; the learner sees the compiler's message without the test's source.

## [1.2.0] - 2026-10-13

Practice labs: something to do after every lesson.

### Added

- **Practice labs.** A lab can now belong to a lesson. It is offered at the end of the lesson
  ("Try it now", or "Mark as read and practice"), listed under its lesson on the level page,
  and passing it leads on to the next lesson. It is checked in the sandbox like any other lab
  and counts toward the level.
- **A practice lab for every lesson of Rust Foundations**: fourteen ten-minute labs, each using
  only what its lesson and the ones before it teach. The first ones are nearly complete
  programs with one marked place to write; the later ones are small sets of functions. Every
  reference solution passes, every starter fails, and 51 deliberately wrong attempts are all
  caught by the tests.
- In content, a practice lab is a folder `practice/<lesson-slug>/` beside `lessons/`. In the
  admin panel, a lab's **Offered** field ties it to a lesson of its course.
- Rust tests can read what the code printed: `printed_by(|| greet())` returns the text. This
  is what lets the first labs, which are about `println!`, check the output itself.
- `npm run content:verify -- rust/basic/control-flow` and the same path for `content:try`
  check a single lesson's practice lab.

### Changed

- Development tools and tests always use the local mailbox, whatever mail account `.env`
  configures for the live site. Before, a real SMTP login in `.env` was picked up by the tests.

## [1.1.1] - 2026-10-13

### Changed

- **Running a lab's untouched starter code now explains itself.** The reason shown for the
  failed test says which function is not written yet and that its placeholder has to be
  replaced, instead of repeating the language's own "not yet implemented". This covers Rust's
  `todo!()`, Python's `NotImplementedError` and C#'s `NotImplementedException`.
- The Rust lab starters say at the top of the file what `todo!(...)` means.
- Rust's advice to set `RUST_BACKTRACE=1`, which nobody can follow in the sandbox, is no longer
  shown with a failed test.

## [1.1.0] - 2026-10-13

Rust becomes a full course, and the sandbox learns three languages.

### Added

- **A full-course lesson format** (`format: course` in `track.yaml`). Basic starts from zero and
  has ten or more lessons; every lesson has worked examples with their output, common mistakes,
  practice with answers, and links to the sources it rests on. The subject must be researched
  before it is written, and `npm run content:verify` enforces the format.
- **Three lab languages**, each with its own locked-down sandbox image:
  - **C++** (GCC, C++20), built with the address and undefined-behaviour sanitizers, so a
    use-after-free, an out-of-bounds access, a leak or a signed overflow fails the test.
  - **C#** on .NET 10, compiled without MSBuild or NuGet. Test bodies may `await`.
  - **YAML**: the learner writes one file, which is parsed strictly (a repeated key is an
    error), and the tests check what it means.
- **Upgrades update the curriculum.** At every start a site adds the subjects it has never been
  given and updates in place any track whose `revision` was raised, matching lessons, questions
  and labs by slug and key so learners keep their progress. A shipped track that was deleted
  stays deleted.
- Practice answers in a lesson stay folded until the learner asks for them, and links in a
  lesson open in a new tab.
- `npm run content:try -- <track>/<level> <file>` runs any attempt against a lab in the
  sandbox, so an author can check that wrong answers are caught.
- `MAILPIT_URL` lets the API tests use a second mailbox, so they can run beside a live install.

### Changed

- **Rust Development is rewritten as a full course: 46 lessons instead of 12, and 96 exam
  questions instead of 20.** It now starts with what Rust is, installing it and a first program,
  and teaches one concept per lesson. It was written from the official documentation (The Rust
  Programming Language for the 2024 edition, the standard library reference, the Rust
  Reference, the Cargo Book, the Rustonomicon, the API Guidelines and the Performance Book),
  and its examples were compiled and run in the sandbox. The twelve original lessons and twenty
  original questions are still there, reworked and deepened, so progress already made is kept.
- A mock exam attempt draws ten questions from its level's bank instead of using every
  question, so attempts differ once a bank is larger than ten.
- Rust labs compile with the 2024 edition, which is what the lessons teach.
- The landing page, the guide and the README no longer say a level is three lessons.

### Fixed

- When a compiled submission did not fit its tests (a missing function, a wrong parameter
  type), the compiler quoted the offending line of the test, and the learner was shown it even
  for a hidden test. Excerpts from the generated harness are now removed from the output a
  learner sees, for Rust and C++. Messages about the learner's own file are unchanged.

### Not in this release

AI Development and Cyber Security are still in the original short format. Python, Linux
command line, C++, C# and YAML tracks have been started and set aside until they can be written
to the same standard as Rust.

## [1.0.0] - 2026-10-13

The first complete release: documented, scanned, and checked end to end in a production build.

### Added

- **User guide** at `/guide` in the app and in [docs/USER-GUIDE.md](docs/USER-GUIDE.md): getting
  started, levels and marks, the dashboard, lessons, exams, labs, profile and security, and a
  section for instructors and administrators, with a screenshot of every screen.
- **README** with screenshots, a quick start, configuration, development commands and known
  limits.
- **Browser tour** (`npm run e2e`): a real browser goes through first-run setup, sign-up, three
  lessons, a graded exam, a lab compiled and tested in the sandbox, a password reset by email,
  and the admin panel signed in with a second factor. `npm run screenshots` runs the same tour
  and writes the pictures used by the guide and the README.
- A favicon, and designed 404 and error pages.
- Security scan targets for the project (`security/secsuite/targets.yml`).

### Security

A scan with semgrep, gitleaks, trivy and checkov, plus OWASP HTTP checks and an accessibility
audit of the running site, found no committed secrets and no vulnerable dependencies. What it
did find is fixed:

- AES-GCM now states its tag length, so a shortened authentication tag is refused.
- The sandbox runner no longer runs as root. It is an unprivileged user that reaches the Docker
  socket through one supplementary group (`DOCKER_GID`).
- Runtime images no longer contain npm or yarn. Every image finding was inside a library
  bundled with the package manager, which those images never use.
- Runtime images apply the operating-system security updates published since their base image
  was built. The last finding left in them was a patched zlib waiting to be installed.
- Password-reset emails are limited to one per account every two minutes, whatever address the
  requests come from.
- `npm audit` is clean: a development-only transitive `esbuild` is overridden to a patched
  version.
- The development launcher no longer starts its child through a shell.

### Changed

- Text colors meet WCAG AA (4.5:1) on every surface they are used on: the two grays, brass,
  patina, the level labels, and dim text on dark surfaces were adjusted after measuring each
  pairing.
- The logo mark is drawn instead of typed, so links that contain it have an accurate
  accessible name.
- The code editor's files and the guide's screenshots carry a version in their URL, so a CDN in
  front of the site cannot serve a previous release's copy.
- Sandbox images declare `HEALTHCHECK NONE`: a sandbox lives for one submission.

### Fixed

- "Verify in sandbox" calls a lab sound only when its starter code was run and fell short. It
  used to say sound when the sandbox had failed to run the starter at all.

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
