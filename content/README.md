# Authoring content

The curriculum is plain files. The seeder loads this folder into the database, and
`npm run content:verify` checks every file and **runs every lab in the real sandbox**.

```
content/tracks/<track>/
  track.yaml
  <level>/                    basic | medium | advanced | professional
    course.yaml
    lessons/NN-<slug>.md      ten or more in Basic (see "Lessons")
    questions.yaml            at least one per lesson
    lab/
      lab.yaml
      scenario.md
      instructions.md
      starter.<ext>           what the learner starts from
      solution.<ext>          reference solution, never shown to learners
      tests/NN-<slug>.<ext>   three or more test bodies
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
format: course       # course | outline (see "Lessons")
revision: 1          # raise it to update sites that already have the track
exams:               # optional: track-wide exams with their own blueprint
  - slug: certification-practice-exam
    title: Certification Practice Exam
    description: One sentence.
    timeLimitMinutes: 90
    passPercent: 80
    rules:           # each rule draws `count` questions; `category` and `level` are optional filters
      - category: network-security
        count: 20
      - level: professional
        count: 10
retired:             # optional: see "Revising a track that is already installed"
  lessons: [basic/old-lesson-slug]
  labs: [basic/old-lab-slug]
  questions: [old-question-key]
```

Every level's mock exam, and a short track assessment drawing three questions from each level,
are made for you. `exams` adds more, such as a full-length practice exam drawn by a
certification's domains: give each question the `category` of its domain, and one rule per
domain. `content:verify` checks that the bank can fill every rule.

## course.yaml

```yaml
title: Rust Foundations
summary: One or two sentences on what this level covers.
outcomes:            # three to five things the learner can do afterwards
  - Explain ownership, borrowing and lifetimes
exam:
  title: Rust Foundations Mock Exam
  description: One sentence.
  timeLimitMinutes: 20
  passPercent: 70
  questionCount: 10  # drawn from the level's bank for each attempt
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

A track is written in one of two formats, named in `track.yaml` as `format:`.

### `format: course` (use this for anything new)

A full course that a beginner can follow from zero.

| Level | Lessons | Questions |
| --- | --- | --- |
| Basic | 10 or more | one per lesson, 12 or more |
| Medium | 8 or more | one per lesson, 12 or more |
| Advanced, Professional | 6 or more | one per lesson, 12 or more |

- **Basic starts from nothing**: what the subject is and where it is used, getting set up and
  running a first program, then one concept per lesson in the order a beginner needs it. A
  lesson never relies on something an earlier lesson has not taught.
- **Research before writing.** Read the official documentation and the tables of contents of two
  or three respected courses, and build the lesson list so that no basic topic is missing. Check
  every fact against the official source, and run every example. Write in your own words.
- **Each lesson is about 1,000 words of prose** (the checker counts code as well and accepts 600
  to 1,600 in all) with these sections, in this order:
  `## Outline`, the teaching sections (at least three code examples, each showing its output),
  `## Common mistakes`, `## Practice` (three small exercises, then `### Answers`, which the
  reader keeps folded until asked), `## Key takeaways`, and `## Further reading` with two to four
  links to the pages the lesson rests on, official documentation first.
- An exam attempt draws `exam.questionCount` questions (default 10) from the level's bank, so a
  bank larger than that gives every attempt a different paper.

### `format: outline`

The original short format: exactly three lessons of 300 to 500 words (an `## Outline` list, the
sections with at least one code example, and `## Key takeaways`) and exactly five questions. It
remains for tracks that have not been expanded yet.

Fenced code blocks must name their language in both formats.

### Revising a track that is already installed

A site loads each shipped track once. To send an improved version to sites that already have
it, raise `revision:` in `track.yaml`. On the next start those sites update the track in place:
lessons, questions, exams and labs are matched by slug and key, so **keep the slug of anything
you keep** (a lesson's slug is its file name without the number) and learners keep their
progress. Renumbering a lesson file to move it is fine. Content a site created itself is not
touched; edits a site made to shipped content are replaced.

An update adds and replaces; it never removes on its own. When a revision drops a lesson, lab or
question that an earlier one shipped, list it under `retired:` in `track.yaml` (lessons and labs
as `level/slug`, a practice lab as `level/practice-<lesson-slug>`, questions by key). The update
archives exactly those: learners no longer see them and new exam papers no longer draw them, but
the progress, attempts and submissions that point at them are kept. `content:verify` refuses a
retired item that is still shipped.

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
language: bash               # rust | python | bash | cpp | csharp | yaml
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

### Practice labs

A level can also give a lesson a small lab of its own, so what the lesson taught is tried at
once instead of at the end of the level:

```
content/tracks/<track>/<level>/practice/<lesson-slug>/
  lab.yaml          as above, without `slug` (the folder name supplies it)
  instructions.md
  scenario.md       optional; one or two sentences
  starter.<ext>, solution.<ext>, tests/, data/     as for any lab
```

- The folder is named after the lesson: its file name without the number and `.md`.
- A practice lab takes ten to twenty minutes and uses **only what its own lesson and the lessons
  before it have taught**. In the first lessons that means a starter that is nearly complete,
  with one clearly marked place to write.
- It is held to the same proof as any lab: three or more tests with the first one visible, a
  reference solution that passes, and a starter that builds but does not pass.
- The learner reaches it from the end of the lesson and from the level page. Practice labs
  count toward the level like any other lab.

### How a test body runs

Each test file is a *body*, not a whole program. The runner wraps it in a harness:

| Language | Learner file  | The test body is…                                             | Fail by                 |
| -------- | ------------- | ------------------------------------------------------------- | ----------------------- |
| Rust     | `solution.rs` | the body of a function. `use solution::*;` is in scope, so the learner's items must be `pub`. | `assert!`, `assert_eq!`, `panic!` |
| Python   | `solution.py` | a script in which everything the learner's file defines is in scope, as after `from solution import *`. | `assert`, raising       |
| Bash     | `solution.sh` | a script with `assert_eq ACTUAL EXPECTED [MESSAGE]` and `fail MESSAGE` defined. Run the learner's script with `bash solution.sh …`. | `assert_eq`, `fail`, non-zero exit |
| C++      | `solution.cpp` | the body of a function. The learner's file is included above it, so everything it declares is in scope. | `CHECK`, `CHECK_EQ`, `CHECK_THROWS`, `mettle::fail`, an escaping exception |
| C#       | `solution.cs` | the body of an `async Task` method, so it may `await`. Declare the lab's types without a namespace so the test can name them. | `Check.True`, `Check.Equal`, `Check.SequenceEqual`, `Check.Throws<T>`, `Check.ThrowsAsync<T>`, an escaping exception |
| YAML     | `solution.yaml` | a **Python** script. The file is already parsed: `doc` (first document), `docs` (all of them), `RAW` (the text), `at(doc, 'a.b.0')`, and the `yaml` module. | `assert`, raising |

- Rust is compiled with `rustc --edition 2024`, standard library only. No crates.
  A Rust test can read what the code printed: `printed_by(|| greet("Ada"))` returns the text,
  so a lab about `println!` can check the output itself. To call a `main` in the learner's
  file, write `printed_by(solution::main)`; a bare `main` is the test program's own.
- Python is 3.15 with NumPy 2.5, pandas 3 and pyarrow 26 (for Parquet). No other packages, no
  network. Loading pandas takes about half a second and 110 MB, so give pandas labs
  `memoryMb: 512` and `timeLimitMs: 10000`. Compare results with
  `check_frame(actual, expected, message, **options)` (DataFrames, Series and Indexes, with
  `pandas.testing`'s options such as `check_dtype=False` or `rtol=1e-9`) and
  `check_array(actual, expected, message, **options)` (NumPy; floats within tolerance), not with
  `pandas.testing` directly: its report shows the expected values in the one line a hidden test
  displays. The helpers print that report where only a visible test shows it, then fail with
  `message`. Fixtures are text, so a test that needs a Parquet file writes it first. A Python test can treat the
  learner's file as a program: `run_script(stdin="Ada\n", args=["--loud"])` runs
  `python solution.py`, typing the input into it, and returns `.out`, `.err` and `.code`. So a
  beginner's script that reads with `input()` and prints is tested as it is written.
  `printed_by(greet, "Ada", stdin="")` calls one function and returns what it printed. While
  the file is loaded for the test, `input()` finds nothing to read: a script stops at its first
  `input()` and keeps only what it defined before it, so define the functions a test calls
  above the script part, or under `if __name__ == "__main__":`, which `run_script` runs and the
  test's own load does not. If the file raises anything else while it loads, the test fails
  with the traceback `python solution.py` would print. Python files among a lab's fixtures
  (`data/*.py`) are modules the learner's file and the tests import by name (`import raffle_data`),
  both when the file is loaded and under `run_script`; do not name one after a standard module.
- C++ is GCC 14 with `-std=c++20 -Wall -Wextra -pthread`, standard library only, built with the
  address and undefined-behaviour sanitizers. A use-after-free, an out-of-bounds access, a
  **memory leak** or a signed overflow fails the test, so the reference solution must be clean.
  A test body cannot `#include`; the common standard headers are already included (the list is
  in `apps/runner/src/languages/cpp-prelude.ts`). `CHECK_EQ(actual, expected, message)` prints
  both values on failure.
- C# is compiled with the current language version on .NET 10, nullable reference types on,
  base class library only. `System`, `System.Collections.Generic`, `System.IO`, `System.Linq`,
  `System.Text`, `System.Threading` and `System.Threading.Tasks` are imported for both files.
  `Check.Equal(actual, expected, message)` prints both values on failure. Set `memoryMb: 512`.
- A YAML lab is one file the learner writes or repairs. Before any test runs it is parsed
  strictly: invalid YAML, or a key written twice in one mapping, stops the run with the
  parser's message. The parser is PyYAML, which follows YAML 1.1 (`no` is a boolean). Use the
  parsed values for what the file means and `RAW` or `yaml.compose(RAW)` for how it is written.
  The test files are Python (`tests/NN-<slug>.py`); the starter must be valid YAML.
- Where a helper takes both values, the order is actual, expected, message.
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

### Checking that wrong answers are caught

A lab is only as good as the mistakes its tests catch. `content:try` runs any file as the
learner's code against one lab, in the real sandbox, and prints each test's result:

```
npm run content:try -- rust/basic path/to/attempt.rs
```

Write two or three plausible wrong attempts (an off-by-one, a missed edge case, a rule from
the instructions ignored) and make sure each fails at least one test.
