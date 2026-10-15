The register `data/register.csv` has one control per row, with the columns
`asset,category,type,control`. Every asset should have at least one **preventive**, one
**detective** and one **corrective** control (the list `REQUIRED` in the starter).

The starter already reads the file (`read_register`) and reads a `type` cell (`control_types`).
Write the body of **`find_gaps(rows, required=REQUIRED)`**, where it says `YOUR CODE`:

1. Collect the types each asset has. One asset has many rows; the asset name is
   `row["asset"].strip()`, so names with spaces around them are the same asset.
2. Get the types of a row with `control_types(row["type"])`. A cell can name several types
   (`deterrent;detective`: a visible camera deters and records), case does not matter, and
   `deterring` counts as `deterrent`. The function already does all of this.
3. Return a `dict` from each asset that lacks any type in `required` to the **list** of the types
   it lacks, in the order of `required`. Leave out assets that have them all. Assets appear in
   the order they first appear in the register; an empty register gives `{}`.

`required` can be another list, such as `["directive", "deterrent"]`; use the one you are given.

**Example.** For `data/register.csv`, `find_gaps(read_register("data/register.csv"))` returns:

```python
{"file server": ["corrective"], "office": ["corrective"],
 "laptops": ["detective"], "email": ["detective", "corrective"]}
```

and `python solution.py` prints:

```text
file server: missing corrective
office: missing corrective
laptops: missing detective
email: missing detective, corrective
```

The office has a lock (preventive), a camera (deterrent and detective) and signs (deterrent), but
nothing that restores normal operation after a break-in or a flood.
