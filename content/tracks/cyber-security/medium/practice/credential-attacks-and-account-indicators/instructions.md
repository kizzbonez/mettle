Write two functions in `solution.py`. Times are UTC, written like `2026-10-16T02:18:44Z`, and
the files are **not** in time order. `datetime.fromisoformat` reads them.

1. `mfa_fatigue(path, limit=5, window_minutes=10)` reads a push-notification log, a CSV with
   the columns `time,user,result,app,ip`. `result` is `approved`, `denied` or `timeout`; a
   **rejected** prompt is `denied` or `timeout`. For each user:
   - `"approved-after-fatigue"` when the user approved a prompt and at least `limit` rejected
     prompts fall in the `window_minutes` minutes up to that approval (from the approval time
     minus the window to the approval time, both included): the attacker has the password and
     the user gave in;
   - otherwise `"fatigue"` when at least `limit` rejected prompts fall within one window, that
     is, the last of them at most `window_minutes` minutes after the first: the password is
     known, even though nobody approved;
   - otherwise the user is not reported.

   Return a list of `(user, status)` tuples sorted by user.
2. `concurrent_sessions(path)` reads a session export, a CSV with the columns
   `session,user,start,end,country,device`; an empty `end` means the session is still active.
   Two sessions of the **same user** are concurrent when each starts before the other ends (a
   session that ends exactly when the other starts does not overlap it; an active session has
   not ended). Report a pair when the two are concurrent **and** their `country` codes differ,
   compared ignoring case: one person on a laptop and a phone in the same country is normal.
   Return a sorted list of `(user, first_session, second_session)` tuples, with the two session
   IDs of each pair in sorted order.

**Example.** With the files in `data/`:

```python
mfa_fatigue("data/mfa.csv")
# [('d.hale', 'approved-after-fatigue'), ('t.oduya', 'fatigue')]
concurrent_sessions("data/sessions.csv")
# [('d.hale', 'S-0998', 'S-1001'), ('r.singh', 'S-1010', 'S-1011')]
```

`d.hale` rejected six prompts in seven minutes, approved the seventh, and a session from
Romania began a few seconds later while her phone session in Great Britain was still open.
`t.oduya` rejected five prompts in 9 minutes 59 seconds. `r.singh` timed out five prompts, but
eight minutes apart, so no ten-minute window holds five. `k.brennan`'s sessions in Great Britain
and the United States only touch at noon.

**Tip.** Collect each user's times in a `defaultdict(list)`. With `timedelta(minutes=...)`,
`start <= t <= start + window` tests one window; trying every rejected prompt as `start` finds
the busiest one.
