Write three functions in `solution.py` with pandas. A **flag** is true when its text, with the
spaces around it removed, is `yes` in any case (`Yes`, `YES`); anything else is false.

1. `department_metrics(campaign_path)` reads the simulation results (`user`, `department`,
   `opened`, `clicked`, `submitted`, `reported` as flags, `minutes_to_report`) and returns one
   row per department, indexed by `department` (sorted), with these columns in this order:
   `sent` (people in the department), `click_rate`, `submit_rate`, `report_rate` (the share of
   its people whose flag is true, rounded to 2 decimals) and `median_report_minutes` (the median
   `minutes_to_report` of the people who **reported**; `NaN` when nobody did).
2. `risk_scores(people_path)` applies the behavior risk scoring model to `people.csv` and returns
   one row per person, indexed by `user`, with the columns `department`, `score`,
   `targeted_training`, `phishing_resistant_mfa`:

   | Signal | Points |
   | --- | --- |
   | `submitted_90d` is 1 or more (submitted credentials in a simulation) | +30 |
   | `clicked_90d` is 1 or more | +10 |
   | `reported_90d` is 1 or more (reported a simulation) | −15 |
   | `training_overdue` flag | +15 |
   | `privileged` flag (exposure, not misbehavior) | +20 |
   | `handles_payments` flag | +15 |
   | `dlp_events_90d` | +10 per event, at most +30 |

   `score` (an integer) is the total kept between 0 and 100. `targeted_training` is
   `score > 50` and `phishing_resistant_mfa` is `score > 70`. Sort by `score`, highest first,
   then by `user`.
3. `manager_report(scores)` takes the result of step 2 and returns what managers may see,
   aggregates only: one row per department, indexed by `department` (sorted), with `people`
   (the count), `mean_score` (rounded to 1 decimal) and `needs_training` (how many have
   `targeted_training`).

**Example.**

```text
department_metrics("data/campaign.csv")
                 sent  click_rate  submit_rate  report_rate  median_report_minutes
department
Estimating          3        0.33          0.0         0.67                   10.0
Finance             4        0.75          0.5         0.50                   15.5
Office              3        0.33          0.0         1.00                    4.0
Site Operations     3        0.33          0.0         0.33                   31.0

risk_scores("data/people.csv") begins
                department  score  targeted_training  phishing_resistant_mfa
user
r.admin             Office    100               True                    True
d.kim              Finance     80               True                    True
g.ivanova          Finance     55               True                   False
i.larsen   Site Operations     55               True                   False

manager_report(risk_scores("data/people.csv"))
                 people  mean_score  needs_training
department
Estimating            1        10.0               0
Finance               4        45.0               2
Office                2        50.0               1
Site Operations       2        45.0               1
```

`r.admin` reaches 110 points and is kept at 100. Finance clicked most, was the only department
to submit credentials and reported slowest: a case for targeted training on payment fraud.

**Tips:** `.astype(str).str.strip().str.lower().eq("yes")` turns a column into flags;
`groupby(...).agg(name=(column, "mean"))` builds the columns; `.where(...)` keeps values only
where a condition holds; `.clip(lower, upper)` bounds a column; `True * 30` is `30`.
