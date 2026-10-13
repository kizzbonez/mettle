# Authoring content

The curriculum is plain files. The seeder loads this folder into the database, and
`npm run content:verify` checks every file and **runs every lab in the real sandbox**.

```
content/tracks/<track>/
  track.yaml
  <level>/                    basic | medium | advanced | professional
    course.yaml
    lessons/NN-<slug>.md      three per level
    questions.yaml            five per level
    lab/
      lab.yaml
      scenario.md
      instructions.md
      starter.<ext>           what the learner starts from
      solution.<ext>          reference solution, never shown to learners
      tests/NN-<slug>.<ext>   three test bodies
      data/                   optional read-only fixtures
```

`content/tracks/cyber-security/basic/` is a complete, verified example. Copy its shape.

## track.yaml

```yaml
title: Rust Development
tagline: One short line for the landing page.
description: Two or three sentences.
icon: Cog            # any Lucide icon name
category: rust       # default category for this track's questions
sortOrder: 1
```

## course.yaml

```yaml
title: Rust Foundations
summary: One or two sentences on what this level covers.
outcomes:            # three to five things the learner can do afterwards
  - Explain ownership, borrowing and lifetimes
exam:
  title: Rust Foundations Mock Exam
  description: One sentence.
  timeLimitMinutes: 10
  passPercent: 70
```

## Lessons

Markdown with front matter. The file name sets the order and the slug.

```markdown
---
title: Ownership and Borrowing
summary: One sentence shown in the syllabus.
minutes: 20
objectives:
  - Three or four measurable objectives
---

## Outline
…
```

Write the body as a lesson a learner can actually read: an `## Outline` list of the sections,
then the sections themselves with short explanations, at least one code example, and a closing
`## Key takeaways` list. 300 to 500 words. Fenced code blocks must name their language.

## questions.yaml

```yaml
- key: rust-basic-01          # globally unique and stable; never reuse
  type: single                # single | multiple | true_false
  category: rust              # optional, defaults to the track category
  tags: [ownership]
  prompt: |
    Markdown. Code goes in fenced blocks.
  options:
    - text: The right answer
      correct: true
    - text: A plausible wrong answer
  explanation: |
    Why the right answer is right, and why the tempting one is wrong.
```

- `single` and `true_false`: exactly one option is `correct`. `multiple`: two or more.
- Four options for `single` and `multiple`; two (`True`, `False`) for `true_false`.
- Wrong options should be mistakes people really make.
- Every question needs an explanation that teaches.

## Labs

```yaml
# lab.yaml
slug: failed-login-triage
title: Failed Login Triage
summary: One sentence.
language: bash               # rust | python | bash
minutes: 30
timeLimitMs: 5000            # per test
memoryMb: 128
tests:
  - name: Finds the offenders in the sample log     # shown to the learner
    file: 01-sample-log.sh
    hidden: false            # visible: runs on "Run", output shown in full
  - name: Applies the threshold exactly
    file: 02-threshold.sh
    hidden: true             # hidden: runs only on "Submit", source never shown
  - name: Handles ties and an empty log
    file: 03-edge-cases.sh
    hidden: true
```

`scenario.md` sets the scene. `instructions.md` is the numbered task list, including the exact
signatures or output format the tests rely on. Convention: the first test is visible and the
other two are hidden.

### How a test body runs

Each test file is a *body*, not a whole program. The runner wraps it in a harness:

| Language | Learner file  | The test body is…                                             | Fail by                 |
| -------- | ------------- | ------------------------------------------------------------- | ----------------------- |
| Rust     | `solution.rs` | the body of a function. `use solution::*;` is in scope, so the learner's items must be `pub`. | `assert!`, `assert_eq!`, `panic!` |
| Python   | `solution.py` | a script that starts after `from solution import *`.          | `assert`, raising       |
| Bash     | `solution.sh` | a script with `assert_eq ACTUAL EXPECTED [MESSAGE]` and `fail MESSAGE` defined. Run the learner's script with `bash solution.sh …`. | `assert_eq`, `fail`, non-zero exit |

- Rust is compiled with `rustc --edition 2021`, standard library only. No crates.
- Python is 3.12 with NumPy. No other packages, no network.
- Each test is its own process with its own time limit.
- Always give assertions a message: for hidden tests the message is all the learner sees.
  Say what was being checked, not what the answer is.
- Fixtures go in `lab/data/` and appear in the sandbox as `data/<name>`.

### What `content:verify` requires of a lab

- The **reference solution passes all three tests**.
- The **starter builds** (compiles, or passes the syntax check) but does **not** pass all tests.

```
npm run content:verify                 # everything
npm run content:verify -- rust         # one track
npm run content:verify -- rust/basic   # one level
```
