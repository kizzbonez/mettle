Write `solution.go`, a library in the package `ergboard` (it has no `main`). The starter declares
every type, error and function the tests use: keep their names, signatures and the texts of the
sentinel errors. You may add unexported helpers of your own. The tests call your functions
directly, from inside the package.

1. **Erg times.** `ErgTime` is a `time.Duration` measured to a tenth of a second.
   - **`ParseErgTime(s string) (ErgTime, error)`** reads `m:ss.t`: one or more digits of
     minutes, a colon, **exactly two** digits of seconds from `00` to `59`, a dot and **exactly
     one** digit of tenths. `"7:12.4"` is 7 minutes 12.4 seconds and `"12:00.0"` is 12 minutes.
     Anything else, such as `"7:5.2"`, `"7:60.0"`, `"7:12"`, `"7:12.45"`, `":12.4"`, `"-7:12.4"`
     or `" 7:12.4"`, returns an error that wraps `ErrBadTime` and quotes the text:
     `bad erg time "7:5.2"`.
   - **`(t ErgTime) String() string`** writes the time back as `m:ss.t`, such as `6:58.0`,
     dropping anything below a tenth. `ErgTime` is then a `fmt.Stringer`.
   - **`(t ErgTime) MarshalJSON() ([]byte, error)`** writes it as a JSON string: `"6:58.0"`.
2. **Reading results.** First write `Error` and `Unwrap` for `*LineError`: `Error` returns
   `line 5: bad erg time "7:5.2"` (the line number, a colon, a space and `Err`'s text) and
   `Unwrap` returns `Err`. Then **`ReadResults(r io.Reader) ([]Result, error)`** reads CSV with
   `encoding/csv`:
   - The first record must be exactly `member,date,time`. If it is not, or the input is empty,
     return `nil` and a `*LineError` for line 1 that wraps `ErrBadHeader`.
   - Each later record is one result. Remove spaces around each field. Check them in this
     order, and for the first problem record a `*LineError` with the record's line number
     wrapping: `ErrFields` when the record does not have exactly 3 fields; `ErrNoMember` when the
     member is empty; an error that wraps `ErrBadDate` and quotes the field (`bad date
     "2026-13-01"`) when the date is not `2006-01-02`; or the error from `ParseErgTime`.
   - Line numbers are the file's own, counted from 1 with the header as line 1. Blank lines are
     skipped by the CSV reader but still counted, so use `FieldPos(0)` on the reader after each
     record to find its line. Set `FieldsPerRecord = -1` so that the reader leaves the field
     count to you.
   - Keep going after a bad line. Return every valid result in file order, and an error made
     with `errors.Join` from the line errors in line order, which is `nil` when every line was
     good.
   - Any other error, from the CSV reader or from `r`, stops reading: return `nil` and that
     error, wrapped with `%w`.
3. **Ranking.**
   - **`BestBy[K comparable, V any](items []V, key func(V) K, better func(a, b V) bool) map[K]V`**
     groups `items` by `key` and keeps one item per key: a later item replaces the one kept so
     far only when `better(later, kept)` is true, so among equally good items the first stays.
     It works for any types, not only results.
   - **`Standings(results []Result) []Entry`** returns one entry per member (names are compared
     exactly as written): the member's best result, the lowest time, with a tie in time going to
     the earlier date; the `Date` of that best result; and `Attempts`, the member's number of
     results. Use `BestBy`. Sort by best time, fastest first, then by member name. Members with
     the same best time share a rank, and the next rank skips the shared places: 1, 1, 3. Do not
     change `results`. No results give an empty list.
   - **`Attempts(results []Result, member string) iter.Seq[Result]`** yields that member's
     results, earliest date first, with results on the same date in their original order. It
     must stop as soon as the loop that ranges over it stops, and must not change `results`.
4. **Writing JSON.** Add tags to `Entry` so that its members are `rank`, `member`, `best`, `date`
   and `attempts`, in that order. **`WriteJSON(w io.Writer, entries []Entry) error`** writes the
   entries as one JSON array indented with two spaces and followed by a newline (a
   `json.Encoder` with `SetIndent("", "  ")` does exactly this). An empty or `nil` list is
   written as `[]`. Return any write error.

The sample month, read with `ReadResults`:

```text
member,date,time
ada,2026-10-03,7:12.4
bo,2026-10-03,6:58.0
ada,2026-10-17,7:05.9
cy,2026-10-17,7:5.2
bo,2026-10-17,6:58.0
dee,2026-10-31,7:40.1
,2026-10-31,7:01.0
ada,2026-10-31,6:58.0
```

gives six results and this error, whose two parts `errors.Is` finds as `ErrBadTime` and
`ErrNoMember`, and whose first `*LineError`, found with `errors.As`, has `Line` 5:

```text
line 5: bad erg time "7:5.2"
line 8: no member name
```

`Standings` of those six results, written out in short:

```text
[]Entry{
	{Rank: 1, Member: "ada", Best: 6:58.0, Date: 2026-10-31, Attempts: 3},
	{Rank: 1, Member: "bo", Best: 6:58.0, Date: 2026-10-03, Attempts: 2},
	{Rank: 3, Member: "dee", Best: 7:40.1, Date: 2026-10-31, Attempts: 1},
}
```

Bo rowed 6:58.0 twice; the earlier day counts. Ada and Bo share first place, so Dee is third.
`WriteJSON` of the first two entries writes:

```json
[
  {
    "rank": 1,
    "member": "ada",
    "best": "6:58.0",
    "date": "2026-10-31T00:00:00Z",
    "attempts": 3
  },
  {
    "rank": 1,
    "member": "bo",
    "best": "6:58.0",
    "date": "2026-10-03T00:00:00Z",
    "attempts": 2
  }
]
```

and `for r := range Attempts(results, "ada")` gives Ada's results of 3, 17 and 31 October, in
that order.

**Tips.** Write and check task 1 first; `strings.Cut` splits `7:12.4` at the colon and then at
the dot. A small `allDigits` helper keeps `ParseErgTime` readable. `errors.Join` of no errors is
`nil`. `slices.SortFunc` with `cmp.Or` sorts by several keys, and `slices.SortStableFunc` keeps
the original order of equal elements. Sort a copy, never the caller's slice.
