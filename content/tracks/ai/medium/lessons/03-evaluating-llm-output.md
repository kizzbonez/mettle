---
title: Evaluating LLM Output
summary: Build a test set, pick metrics that fit the task, and use a model as a judge without fooling yourself.
minutes: 25
objectives:
  - Assemble an evaluation set that represents real use, including hard cases
  - Match a metric to the kind of output being measured
  - List the known weaknesses of LLM judges and a mitigation for each
  - Decide whether a difference between two scores means anything
---

## Outline

1. Why you need a test set
2. Choosing a metric
3. A model as the judge
4. Reading results honestly

## Why you need a test set

A prompt change that fixes one answer can quietly break ten others. Without a fixed set of
examples, every change is judged by whichever inputs you happened to try. An **evaluation set**
is a list of inputs, each paired with a description of a good output. Build it from real use:
typical requests, edge cases, and every failure a user has reported.

Keep part of the set aside and do not look at it while tuning. A prompt adjusted until it passes
the examples in front of you has learned those examples, not the task.

## Choosing a metric

| Output                | Suitable metric                                  |
| --------------------- | ------------------------------------------------ |
| One label from a list | Accuracy; precision and recall per label         |
| Extracted fields      | Match rate per field                             |
| Retrieved passages    | Recall at k: was the right passage in the top k? |
| Open-ended text       | A rubric applied by people or by a model         |

Start with checks that code can make: does the output parse, is the label right, does the cited
source exist. They are cheap, fast and repeatable.

```python
def run_eval(cases, system, grade):
    """Return the fraction of cases the system gets right."""
    passed = [grade(case["expected"], system(case["input"])) for case in cases]
    return sum(passed) / len(passed)
```

## A model as the judge

For open-ended answers, a second model can apply a rubric. This scales, and it has known
weaknesses:

- **Noise.** The same answer can get different verdicts on different runs.
- **Position bias.** When comparing two answers, a judge may favor one position.
- **Style bias.** Long, fluent, confident answers tend to outscore short correct ones.
- **Shared blind spots.** A judge can miss the same errors the system makes, especially when
  both are the same model.

Mitigations: ask narrow yes-or-no questions instead of a score out of ten; show each pair in
both orders; keep the judge's prompt and model fixed; and compare the judge with human labels
on a sample before trusting it. A judge that often disagrees with people is measuring something
else.

## Reading results honestly

A score is an estimate. On 20 examples one answer is worth five points, so 80% against 85% is
not evidence of anything. Use more examples, repeat the run, and look at which cases changed,
not only at the total. Then read the failures. The number says how often; the transcripts say
why.

## Key takeaways

- Without a test set you cannot know whether a change helped.
- Prefer checks that code can make; use judges for what code cannot check.
- LLM judges are noisy and biased. Validate them against human labels.
- Small differences on small sets are noise. Read the failures.
