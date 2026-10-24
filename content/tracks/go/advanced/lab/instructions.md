Complete `solution.go`. The starter declares every type and function the tests use, with their
exact names and signatures: the three sentinel errors, the `Catalogue` interface and its
`CatalogueFunc` adapter, `Config`, `Result`, `Counts` and `Tally`. Keep them, give `Tally` its
fields, write the bodies, and add any helpers you like (the tests' own names all start with
`test`, or live inside the test functions). You will need `fmt`, `strings` and `sync`.

Every test runs inside `synctest.Test` on the fake clock, under the race detector. A data race
fails a test even when every value is right, and so does a goroutine that is still blocked when
the check is over: you would see `deadlock: main bubble goroutine has exited but blocked
goroutines remain`.

1. **`Tally`** counts finished branches while a check is running, so it is used by several
   goroutines at once: guard its fields with a `sync.Mutex`. Its zero value must be ready to use.
   - **`(t *Tally) Add(r Result)`** puts one result on one of three piles: `Failed` when `r.Err`
     is not nil, otherwise `InStock` when `r.Copies` is more than 0, otherwise `NoCopies`.
   - **`(t *Tally) Counts() Counts`** returns the counts so far.
2. **Checking the config.** `StockCheck` first checks `cfg`. If `Workers` is less than 1,
   `Timeout` is 0 or less, `Attempts` is less than 1 or `Backoff` is negative, it returns `nil`
   and an error that wraps `ErrConfig` (`fmt.Errorf("%w: ...", ErrConfig, ...)`), without calling
   any catalogue.
3. **One call.** Each call to `cat.Count(ctx, branch, isbn)` gets a context of its own made from
   the check's `ctx` with `context.WithTimeout(ctx, cfg.Timeout)` (cancel it when the call is
   done). If, when `Count` returns, that call context has passed its deadline while the check's
   own `ctx` is still live, the call counts as **no answer**: its error is `ErrNoAnswer` and its
   copies 0, **whatever `Count` returned**. Decide this from the call context, not from the
   returned error: some catalogues return their own error when their time is up.
4. **One branch.** Call a branch until it answers, at most `cfg.Attempts` times.
   - An answer with a nil error is final: `Copies` is the count, `Err` is nil.
   - An error that is `ErrBusy` (use `errors.Is`: catalogues wrap it) or a no answer is worth
     another call. Before the second call wait `cfg.Backoff`, before the third `2*cfg.Backoff`,
     before the fourth `4*cfg.Backoff`, and so on. There is no wait after the last call.
   - Any other error is final at once.
   - `Attempts` is the number of calls made; after the last one, `Err` is that call's error.
   - Wait with a `time.Timer` (stopped when you are done) in a `select` that also watches
     `ctx.Done()`, so that a cancel ends the wait at once.
5. **`StockCheck(ctx context.Context, cat Catalogue, isbn string, branches []string, cfg Config, tally *Tally) ([]Result, error)`**
   checks every branch and returns one `Result` per branch, **in the order of `branches`**, and a
   nil error.
   - Use a **worker pool**: `min(cfg.Workers, len(branches))` goroutines that take branch indexes
     from a jobs channel and write each result into its own element of a slice you made with
     `len(branches)` elements. A worker keeps its branch while it waits out a backoff, so at most
     `cfg.Workers` calls are ever in flight.
   - As each branch finishes, `Add` its result to `tally`, unless `tally` is nil. The desk reads
     the tally while the check runs.
   - **Cancellation.** If `ctx` is done before every branch has finished, stop at once: send no
     more jobs, start no more calls, end every backoff wait (the calls in flight end by
     themselves, because their contexts are made from `ctx`). A branch cut short this way is not
     added to the tally. Wait until every goroutine you started has finished, then return `nil`
     and `context.Cause(ctx)`. With a `ctx` that is already done, call nothing.
   - With no branches, return an empty slice and nil.
6. **`Report(results []Result) string`** returns one line per result, in order, then a total,
   each line ending in `"\n"`:
   - `Central: 3 copies (1 call)` for an answer with copies (`1 copy` for one);
   - `Hillside: none on the shelf (1 call)` for an answer of 0;
   - `Old Town: no answer (3 calls)` when the error is `ErrNoAnswer` (wrapped or not);
   - `Riverside: failed: <the error's text> (1 call)` for any other error;
   - and last, `2 of 5 branches have it, 4 copies in all`: the branches with at least one copy,
     the number of results, and the copies of the branches that answered (`1 copy in all` for
     one). `1 call` and `1 copy` are singular; every other number, 0 included, is plural.

**Example**, the test you can run. Five branches and a fake catalogue: Central answers 3 copies
after 2 s; Docks is busy after 1 s, and when called again answers 1 copy after 1 s; Hillside
answers 0 after 1 s; Old Town never answers; Riverside fails after 1 s with
`catalogue offline for maintenance`.

```go
cfg := Config{Workers: 2, Timeout: 10 * time.Second, Attempts: 3, Backoff: 5 * time.Second}
var tally Tally
results, err := StockCheck(ctx, cat, "978-0-14-118776-1",
	[]string{"Central", "Docks", "Hillside", "Old Town", "Riverside"}, cfg, &tally)
fmt.Print(Report(results))
fmt.Println(err, tally.Counts())
```

```text
Central: 3 copies (1 call)
Docks: 1 copy (2 calls)
Hillside: none on the shelf (1 call)
Old Town: no answer (3 calls)
Riverside: failed: catalogue offline for maintenance (1 call)
2 of 5 branches have it, 4 copies in all
<nil> {2 1 2}
```

On the fake clock the whole check takes 48 seconds. At 0 s the two workers call Central and
Docks. At 1 s Docks is busy, so its worker waits 5 s. At 2 s Central answers and its worker takes
Hillside, which answers at 3 s; that worker then takes Old Town, which never answers: calls at
3-13 s, 18-28 s and 38-48 s, with waits of 5 s and 10 s between them. Meanwhile Docks is called
again at 6 s and answers at 7 s, and its worker takes Riverside, which fails at 8 s.

**Tips.** Write `Tally` and `Report` first: they need no goroutines. Then write one call and one
branch as helpers, and test them on one branch with `Workers: 1` before writing the pool. The
feeding loop that sends indexes on the jobs channel needs a `select` with `<-ctx.Done()` and a
labelled `break` to stop early; close the jobs channel when it is done, so that the workers'
`range` loops end.
