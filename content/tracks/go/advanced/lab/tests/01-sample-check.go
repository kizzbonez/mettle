import (
	"context"
	"errors"
	"sync"
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	// The fake clock of synctest: every call below takes fake time only. A goroutine that is
	// still blocked when the check is over fails the test.
	synctest.Test(t, func(t *testing.T) {
		errOffline := errors.New("catalogue offline for maintenance")
		var mu sync.Mutex
		calls := map[string]int{}
		cat := CatalogueFunc(func(ctx context.Context, branch, isbn string) (int, error) {
			mu.Lock()
			calls[branch]++
			n := calls[branch]
			mu.Unlock()
			answer := func(after time.Duration, copies int, err error) (int, error) {
				select {
				case <-time.After(after):
					return copies, err
				case <-ctx.Done():
					return 0, ctx.Err()
				}
			}
			switch {
			case branch == "Central":
				return answer(2*time.Second, 3, nil)
			case branch == "Docks" && n == 1:
				return answer(time.Second, 0, ErrBusy)
			case branch == "Docks":
				return answer(time.Second, 1, nil)
			case branch == "Hillside":
				return answer(time.Second, 0, nil)
			case branch == "Riverside":
				return answer(time.Second, 0, errOffline)
			}
			<-ctx.Done() // Old Town never answers
			return 0, ctx.Err()
		})

		branches := []string{"Central", "Docks", "Hillside", "Old Town", "Riverside"}
		cfg := Config{Workers: 2, Timeout: 10 * time.Second, Attempts: 3, Backoff: 5 * time.Second}
		var tally Tally
		start := time.Now()
		results, err := StockCheck(context.Background(), cat, "978-0-14-118776-1", branches, cfg, &tally)
		elapsed := time.Since(start)

		check.NoError(err, "StockCheck of the five branches from the instructions")
		check.Equal(Report(results), "Central: 3 copies (1 call)\n"+
			"Docks: 1 copy (2 calls)\n"+
			"Hillside: none on the shelf (1 call)\n"+
			"Old Town: no answer (3 calls)\n"+
			"Riverside: failed: catalogue offline for maintenance (1 call)\n"+
			"2 of 5 branches have it, 4 copies in all\n", "Report of the five branches from the instructions")
		check.True(errors.Is(results[3].Err, ErrNoAnswer), "Old Town's error is ErrNoAnswer")
		check.True(errors.Is(results[4].Err, errOffline), "Riverside's error is the catalogue's own error")
		check.Equal(tally.Counts(), Counts{InStock: 2, NoCopies: 1, Failed: 2}, "the tally after the check")
		check.Equal(elapsed, 48*time.Second, "how long the whole check takes, in fake time")
	})
}
