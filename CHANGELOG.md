# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
