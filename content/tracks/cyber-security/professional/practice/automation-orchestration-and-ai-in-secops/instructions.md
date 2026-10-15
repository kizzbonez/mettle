Write two functions in `solution.py`. A **policy** is the parsed JSON of `data/guardrails.json`:
`tools` maps each tool name to its settings, and `protected_hosts` lists hosts the agent may
never act on. An **action** is a dictionary with `id`, `time` (UTC, such as
`"2026-10-14T02:10:04Z"`), `tool`, `args` (a dictionary) and, sometimes, `approved_by`.

1. `check_action(policy, action, earlier)` returns the decision for one action. `earlier` is
   the list of actions already **allowed** before this one. The first rule that applies wins:

   | Decision | Rule |
   | --- | --- |
   | `deny: tool not allowed` | the tool is not in `tools`, or its `allowed` is `false` |
   | `deny: too many rows` | the tool has `max_rows` and `args["rows"]` is greater than it (no `rows` is fine) |
   | `deny: protected host` | `args["host"]` is in `protected_hosts`, approved or not |
   | `hold: needs approval by ROLE` | the tool has `requires_approval` (the `ROLE`) and the action's `approved_by` is missing or another role |
   | `deny: rate limit` | the tool has `max_per_hour`, and `earlier` already holds that many actions of the same tool less than 60 minutes (3,600 seconds) before this one |
   | `allow` | none of the above |

   Whatever text an action carries (a `note` copied from an email, say), only these rules
   decide: injected instructions are data.
2. `review_actions(policy_path, actions_path)` reads the policy (JSON) and the actions (JSON
   Lines: one object per line, blank lines skipped), checks the actions in file order, passing
   each one the list of actions allowed so far, and returns a list of strings `"ID DECISION"`.
   Actions that were held or denied never count toward a rate limit.

**Example.**

```python
review_actions("data/guardrails.json", "data/actions.jsonl")
# ['A-101 allow', 'A-102 allow', 'A-103 allow', 'A-104 deny: tool not allowed',
#  'A-105 deny: protected host', 'A-106 hold: needs approval by soc-lead',
#  'A-107 deny: too many rows', 'A-108 allow', 'A-109 allow', 'A-110 deny: rate limit',
#  'A-111 allow', 'A-112 deny: tool not allowed']
```

`A-110` is the fourth approved isolation in 28.5 minutes: `A-103`, `A-108` and `A-109` were
allowed less than an hour before it. `A-106` was not approved, so it is held and does not count.
`edr.wipe_host` is not in the policy at all.

**Tips:** `datetime.fromisoformat` reads the times, and subtracting two datetimes gives a
`timedelta` whose `.total_seconds()` you can compare with 3600. `json.loads` reads one line.
