`solution.go` declares two sentinel errors, `ErrUnknownBib` and `ErrCollected`. Keep them as they
are. `runners` maps each bib number to the runner's name, and `collected` records the bibs already
handed out. Complete the three functions. Every error message below must match exactly.

1. **`parseBib(text string) (int, error)`** reads a bib number as the volunteer typed it. Remove
   spaces around it, then one leading `#` if there is one (`strings.TrimPrefix`), so `" #417 "`
   gives 417.
   - If what is left is not a whole number, return 0 and `strconv.Atoi`'s error wrapped with
     `%w` as `bib "<what was typed>": <the error>`, with the text exactly as given, quoted with
     `%q`: `bib "4l7": strconv.Atoi: parsing "4l7": invalid syntax`.
   - If the number is not from 1 to 999, return 0 and the error `bib 1200 is not from 1 to 999`
     (with the real number).
2. **`collect(runners map[int]string, collected map[int]bool, text string) (string, error)`**
   hands out one bib and returns the runner's name. It returns `""` and an error, and changes
   nothing, when:
   - `parseBib` fails: return its error as it is;
   - no runner has the bib: wrap `ErrUnknownBib` as `bib 88: no runner has this bib`;
   - the bib was already collected: wrap `ErrCollected` as `bib 417 for Ada: bib already
     collected`.

   Otherwise mark the bib as collected and return the name with a nil error.
3. **`collectQueue(runners map[int]string, collected map[int]bool, queue []string) (handed int,
   problems []string)`** calls `collect` for every text in `queue`, in order, and returns how many
   bibs it handed out and a list of the problems. A runner who already has their bib is not a
   problem (they came back to ask again), so skip errors that are, or wrap, `ErrCollected`. Every
   other error becomes a problem written as `<position in the queue, from 1>: <the error>`. Use
   `errors.Is`: the errors from `collect` are wrapped.

```go
runners := map[int]string{417: "Ada", 23: "Bo"}
collected := map[int]bool{}

collect(runners, collected, "#417") // "Ada", nil, and collected[417] is now true
collect(runners, collected, "417")  // "", bib 417 for Ada: bib already collected
collect(runners, collected, "88")   // "", bib 88: no runner has this bib
parseBib("4l7")                     // 0, bib "4l7": strconv.Atoi: parsing "4l7": invalid syntax

collectQueue(runners, collected, []string{"23", "417", "abc", "0"})
// 1, []string{`3: bib "abc": strconv.Atoi: parsing "abc": invalid syntax`, "4: bib 0 is not from 1 to 999"}
```
