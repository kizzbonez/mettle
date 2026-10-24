import (
	"context"
	"strconv"
	"sync"
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	// Twelve branches B1 to B12. Branch Bn answers n%3 copies after one second, so a third of
	// them have none. The catalogue counts the calls in flight at the same moment.
	branches := make([]string, 12)
	for i := range branches {
		branches[i] = "B" + strconv.Itoa(i+1)
	}
	type rig struct {
		mu            sync.Mutex
		running, peak int
		calls         map[string]int
	}
	newCatalogue := func(r *rig) Catalogue {
		return CatalogueFunc(func(ctx context.Context, branch, isbn string) (int, error) {
			r.mu.Lock()
			r.calls[branch]++
			r.running++
			r.peak = max(r.peak, r.running)
			r.mu.Unlock()
			defer func() {
				r.mu.Lock()
				r.running--
				r.mu.Unlock()
			}()
			n, _ := strconv.Atoi(branch[1:])
			select {
			case <-time.After(time.Second):
				return n % 3, nil
			case <-ctx.Done():
				return 0, ctx.Err()
			}
		})
	}

	cases := []struct {
		workers, peak int
		took          time.Duration
	}{
		{4, 4, 3 * time.Second},
		{1, 1, 12 * time.Second},
		{5, 5, 3 * time.Second},
		{12, 12, time.Second},
		{50, 12, time.Second},
	}
	for _, c := range cases {
		synctest.Test(t, func(t *testing.T) {
			r := &rig{calls: map[string]int{}}
			cfg := Config{Workers: c.workers, Timeout: 30 * time.Second, Attempts: 2, Backoff: time.Second}
			start := time.Now()
			results, err := StockCheck(context.Background(), newCatalogue(r), "isbn", branches, cfg, nil)
			took := time.Since(start)
			what := strconv.Itoa(c.workers) + " workers"
			check.NoError(err, "StockCheck of twelve branches with "+what)
			check.Equal(len(results), 12, "one result per branch with "+what)
			for i, res := range results {
				check.Equal(res.Branch, branches[i], "results are in the order of branches, with "+what)
				check.Equal(res.Copies, (i+1)%3, "the copies of each branch, with "+what)
				check.Equal(res.Attempts, 1, "the attempts of a branch that answers at once, with "+what)
			}
			r.mu.Lock()
			peak, called := r.peak, len(r.calls)
			r.mu.Unlock()
			check.Equal(peak, c.peak, "the most calls in flight at the same moment with "+what)
			check.Equal(called, 12, "every branch is called, with "+what)
			check.Equal(took, c.took, "how long the check takes with "+what+", in fake time")
		})
	}

	// The tally is read while the check runs: after 1.5 s the first four branches are done,
	// after 2.5 s the first eight. Reading it while workers write it must be race-free.
	synctest.Test(t, func(t *testing.T) {
		r := &rig{calls: map[string]int{}}
		var tally Tally
		check.Equal(tally.Counts(), Counts{}, "the zero Tally counts nothing")
		cfg := Config{Workers: 4, Timeout: 30 * time.Second, Attempts: 1, Backoff: 0}
		done := make(chan error, 1)
		go func() {
			_, err := StockCheck(context.Background(), newCatalogue(r), "isbn", branches, cfg, &tally)
			done <- err
		}()
		synctest.Sleep(1500 * time.Millisecond)
		check.Equal(tally.Counts(), Counts{InStock: 3, NoCopies: 1}, "the tally while the check runs, after 1.5 s (B1 to B4 done)")
		synctest.Sleep(time.Second)
		check.Equal(tally.Counts(), Counts{InStock: 6, NoCopies: 2}, "the tally while the check runs, after 2.5 s (B1 to B8 done)")
		check.NoError(<-done, "StockCheck with a tally")
		check.Equal(tally.Counts(), Counts{InStock: 8, NoCopies: 4}, "the tally after all twelve branches")
	})

	// Add sorts results into the three piles, from many goroutines at once.
	var tally Tally
	var wg sync.WaitGroup
	for i := range 30 {
		wg.Go(func() {
			switch i % 3 {
			case 0:
				tally.Add(Result{Branch: "a", Copies: 2})
			case 1:
				tally.Add(Result{Branch: "b"})
			default:
				tally.Add(Result{Branch: "c", Copies: 7, Err: ErrNoAnswer})
			}
		})
	}
	wg.Wait()
	check.Equal(tally.Counts(), Counts{InStock: 10, NoCopies: 10, Failed: 10}, "thirty Adds from thirty goroutines, ten of each kind")
}
