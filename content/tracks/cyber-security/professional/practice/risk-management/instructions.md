Write three functions in `solution.py`.

1. `rate(likelihood, impact)` returns `(score, band)` from the lesson's five-by-five matrix:
   `score = likelihood × impact`, and the band is `"L"` for 1 to 4, `"M"` for 5 to 9, `"H"` for
   10 to 15 and `"C"` for 16 to 25. Both values must be whole numbers (`int`) from 1 to 5;
   raise `ValueError` otherwise.
2. `control_value(asset_value, exposure_factor, aro, ef_after, aro_after, annual_cost)` returns
   what a control is worth per year: the ALE before (`asset_value × exposure_factor × aro`)
   minus the ALE after (`asset_value × ef_after × aro_after`) minus `annual_cost`, rounded to
   2 decimals.
3. `check_register(path)` reads the register (a JSON list of risks; see `data/register.json`)
   and returns a list of findings, risk by risk in file order, each risk's in this order:
   - `NO-OWNER ID` when `owner` is empty;
   - `BAD-TREATMENT ID (TREATMENT)` when the treatment, in lower case, is not `mitigate`,
     `transfer`, `accept` or `avoid`. Ignoring a risk is not a treatment;
   - for an **accepted** risk, the board's tolerances:
     - `ACCEPT-TOO-HIGH ID (score N)` when its score is 16 or more;
     - `NEEDS-BOARD ID (ALE A)` when its ALE (`asset_value × exposure_factor × aro`) is more
       than 250,000 and `board_approved` is missing or not `true`. `A` has 2 decimals;
     - `UNSIGNED ID` when `signed_by` is missing, empty, or not the risk's `owner`;
   - for a **mitigated** risk, `NOT-WORTH ID (value V)` when the `control_value` of its
     `control` (`exposure_factor`, `aro` and `annual_cost` after the control) is 0 or less.
     `V` has 2 decimals.

**Example.**

```python
rate(3, 5)                                               # (15, 'H')
rate(4, 4)                                               # (16, 'C')
control_value(900_000, 0.40, 0.25, 0.10, 0.10, 30_000)   # 51000.0
check_register("data/register.json")
# ['ACCEPT-TOO-HIGH R-05 (score 16)', 'NEEDS-BOARD R-05 (ALE 300000.00)',
#  'NO-OWNER R-06', 'UNSIGNED R-06', 'NOT-WORTH R-07 (value -7500.00)',
#  'BAD-TREATMENT R-08 (ignore)', 'UNSIGNED R-09']
```

The ransomware control on R-01 is worth 72,000 − 12,000 − 20,000 = 40,000 a year, but the
sensor control on R-07 costs 15,000 to save 7,500. Invoice fraud (R-05) scores 16 and loses
300,000 a year: the CFO alone may not accept it.

**Tips:** `isinstance(x, int)` tests for a whole number; `json.load` reads the register;
`f"{value:.2f}"` writes 2 decimals.
