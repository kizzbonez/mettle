Write `solution.py`. The starter declares the five functions the tests call: keep their names
and parameters. You may add helper functions. Use pandas, not loops over rows. The files are in
`data/`:

- `scan-2026-10-12.csv`, the scanner's export: `finding_id`, `host`, `ip`, `port`, `cve`,
  `cvss` (the CVSS base score), `title`, `first_seen` (the date the scanner first saw the
  finding, `YYYY-MM-DD`).
- `assets.csv`, the asset inventory: `host`, `ip`, `role`, `owner`, `criticality` (`critical`,
  `high`, `medium` or `low`), `exposure` (`internet`, `partner` or `internal`) and
  `asset_value_usd`.
- `kev.json`, an excerpt of CISA's Known Exploited Vulnerabilities catalog in CISA's JSON
  format: the list `vulnerabilities` holds one object per CVE, with (among other fields)
  `cveID` and `knownRansomwareCampaignUse`, which is `"Known"` or `"Unknown"`.
- `risks.csv`, the stated risks: `risk_id`, `title`, `host`, `exposure_factor`,
  `industry_aro` and `owner`.
- `losses.csv`, the incident and loss history: `incident_id`, `date`, `risk_id`,
  `description`, `loss_usd`.

Everywhere, a **clean host name** has the spaces around it removed and is lower case, in every
file. Dates are compared as calendar dates.

1. **`load_findings(scan_path, assets_path)`** returns the scan findings on inventoried hosts,
   with exactly these columns, in this order: `finding_id`, `host` (clean), `port`, `cve`,
   `cvss`, `first_seen` (a `datetime64` column, as `pd.to_datetime` makes it), `owner`,
   `criticality`, `exposure` (the last three from the inventory).
   - Clean `cve` by removing surrounding spaces and making it upper case. A row with an empty
     `cve` is an informational finding: drop it.
   - The scanner reports some findings twice. Rows with the same clean `host`, `port` and `cve`
     are one finding: keep the row with the **earliest** `first_seen` (on a tie, the smallest
     `finding_id`), with its own `finding_id` and `first_seen`.
   - Keep only hosts that are in the inventory.
   - Sort by `finding_id`; the index is `0, 1, 2, ...`. A scan file with only its header gives
     an empty DataFrame with these columns.

2. **`unknown_hosts(scan_path, assets_path)`** returns a sorted Python list of the clean host
   names that appear in any row of the scan (with or without a CVE) but not in the inventory,
   each once. It returns `[]` when there are none.

3. **`prioritize(findings, kev_path, as_of)`** takes the result of step 1, the KEV file and a
   date string such as `"2026-10-16"`, and returns a **new** DataFrame (leave `findings`
   unchanged) with all of its columns followed by these six, in this order:
   - `kev` (bool): the `cve` is in the catalog;
   - `ransomware` (bool): the catalog entry's `knownRansomwareCampaignUse` is `"Known"`;
   - `priority`: the **first** of these rules that applies:

     | Priority | Rule |
     | --- | --- |
     | `P1` | `kev`, and either `exposure` is `internet` or `ransomware` is true |
     | `P2` | `kev`, or `cvss` is 9.0 or more |
     | `P3` | `cvss` is 7.0 or more, or `criticality` is `critical` and `cvss` is 4.0 or more |
     | `P4` | everything else |

   - `due`: `first_seen` plus the service-level target of the priority, in calendar days:
     P1 7, P2 14, P3 30, P4 90;
   - `days_open` (int): the number of days from `first_seen` to `as_of`;
   - `overdue` (bool): `as_of` is **after** `due`. A finding due on `as_of` is not yet overdue.

   Sort the rows by `priority` (`P1` first), then `criticality` (`critical`, `high`, `medium`,
   `low`), then `cvss` (highest first), then `finding_id`. The index is `0, 1, 2, ...`.

4. **`annual_loss(risks_path, losses_path, assets_path, as_of, years=5)`** returns one row per
   risk in `risks.csv`, indexed by `risk_id` (index named `risk_id`, sorted), with the columns
   `title`, `owner`, `host` (clean), `asset_value`, `exposure_factor`, `sle`, `events`, `aro`,
   `ale`, in this order:
   - `asset_value`: the `asset_value_usd` of the risk's host in the inventory;
   - `events` (int): the number of incidents of that risk dated on or after `as_of` minus
     `years` calendar years and **before** `as_of`. For `as_of="2026-10-16"` and `years=5`
     that is 2021-10-16 to 2026-10-15 inclusive. Incidents whose `risk_id` is not in
     `risks.csv` are ignored; a risk with none has 0;
   - `aro`: `events / years`, or, when `events` is 0, the risk's `industry_aro`;
   - `sle` = `asset_value` × `exposure_factor`, rounded to 2 decimals;
   - `ale` = `asset_value` × `exposure_factor` × `aro`, rounded to 2 decimals.

5. **`register_summary(losses_table, prioritized, appetite)`** takes the results of steps 4 and
   3 and an ALE limit in dollars, and returns one row per risk of `losses_table`, indexed by
   `risk_id`, with the columns `title`, `owner`, `host`, `ale` (from `losses_table`), then:
   - `open_findings`, `p1_findings`, `overdue_findings` (int): how many rows of `prioritized`
     have the risk's host, how many of those are `P1`, and how many are overdue; 0 when none;
   - `exceeds_appetite` (bool): `ale` is greater than `appetite` (equal is within appetite);
   - `action`: `"escalate"` when `exceeds_appetite` is true and `overdue_findings` is more
     than 0; otherwise `"treat"` when `exceeds_appetite` is true, or `overdue_findings` is more
     than 0, or `p1_findings` is more than 0; otherwise `"monitor"`.

   Sort by `ale` (highest first), then `risk_id`.

**Example.** `load_findings("data/scan-2026-10-12.csv", "data/assets.csv")` has 14 rows: the
informational rows are gone, `nas-07` is not in the inventory, and the duplicates of Log4Shell
on `book-web-01` (`F-0998`, first seen 2026-10-02) and of MOVEit on `mft-01` (`F-1019`) give way
to `F-1001` (2026-09-28) and `F-1005` (2026-10-01). `unknown_hosts(...)` is `['nas-07']`.
`prioritize(findings, "data/kev.json", "2026-10-16")` begins (some columns shown):

```text
  finding_id            host             cve  cvss criticality  exposure   kev  ransomware priority        due  days_open  overdue
0     F-1001     book-web-01  CVE-2021-44228  10.0    critical  internet  True        True       P1 2026-10-05         18     True
1     F-1004       vpn-gw-01  CVE-2024-21762   9.8    critical  internet  True        True       P1 2026-10-16          7    False
2     F-1002     book-web-01  CVE-2023-44487   7.5    critical  internet  True       False       P1 2026-09-21         32     True
3     F-1005          mft-01  CVE-2023-34362   9.8        high   partner  True        True       P1 2026-10-08         15     True
4     F-1011  wifi-portal-01   CVE-2024-4577   9.8         low  internet  True        True       P1 2026-10-17          6    False
```

`F-1004` is due on 2026-10-16 itself, so it is not overdue yet. For the risks,
`annual_loss("data/risks.csv", "data/losses.csv", "data/assets.csv", "2026-10-16")` gives, for
example, R05: four gate incidents in the window, so ARO = 4 / 5 = 0.8, SLE = 25,000 × 0.30 =
7,500 and ALE = 6,000; and R01: no incidents, so the industry ARO 0.15 applies, SLE = 480,000 ×
0.60 = 288,000 and ALE = 43,200. `register_summary(losses, ranked, 15000)` begins:

```text
             ale  open_findings  p1_findings  overdue_findings  exceeds_appetite    action
risk_id
R01      43200.0              3            2                 3              True  escalate
R06      18000.0              1            0                 0              True     treat
R02      16800.0              3            2                 3              True  escalate
R03      15000.0              1            1                 0             False     treat
```

**Tips.** `str.strip().str.lower()` cleans names; `sort_values` before `drop_duplicates` decides
which duplicate survives; `merge` joins the inventory; `isin` tests membership; `numpy.select`
applies rules in order; `pd.to_timedelta(..., unit="D")` adds days; `pd.DateOffset(years=...)`
subtracts years; `groupby(...).size()` and `map` count events per risk.
