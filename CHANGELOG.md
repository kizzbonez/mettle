# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-13

The foundation: the data model and the part that runs untrusted code.

### Added

- Monorepo with npm workspaces: `apps/web`, `apps/api`, `apps/runner`, `packages/shared`.
- PostgreSQL schema (26 tables) for accounts and sessions, tracks, courses and lessons, a
  categorised question bank, fixed and dynamically generated exams, hands-on labs with test
  cases, submissions, and progress. Defined with Drizzle; the SQL migration is generated.
- Sandbox runner: executes Rust, Python and Bash submissions in single-use containers with no
  network, a read-only root filesystem, no capabilities, and memory, CPU, process and time
  limits. Each test case runs as its own process and is judged on exit code plus a per-run
  nonce.
- Sandbox images for Rust, Python (with NumPy) and Bash.
- Docker Compose stack with internal-only networks for the database and the runner.
- Lint budgets: 200 lines per file, 40 per function, enforced by ESLint.
- Architecture and schema documentation.
