import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	// One branch, one worker: each case checks the calls made, the result and the fake time taken.
	type answer struct {
		after  time.Duration
		copies int
		err    error
		hang   bool // wait until the call's context is done
		deaf   bool // ignore the context and answer after `after` anyway
	}
	errSocket := errors.New("socket closed")
	errUnknown := errors.New("no such branch")
	cases := []struct {
		what     string
		cfg      Config
		answers  []answer // the last one repeats
		copies   int
		attempts int
		err      error
		took     time.Duration
	}{
		{"a branch that never answers", Config{1, 10 * time.Second, 3, 5 * time.Second},
			[]answer{{hang: true}}, 0, 3, ErrNoAnswer, 45 * time.Second},
		{"a branch that is busy twice, then answers", Config{1, 10 * time.Second, 3, 5 * time.Second},
			[]answer{{after: time.Second, err: ErrBusy}, {after: time.Second, err: ErrBusy}, {after: time.Second, copies: 4}},
			4, 3, nil, 18 * time.Second},
		{"a branch that stays busy, with two attempts", Config{1, 10 * time.Second, 2, 5 * time.Second},
			[]answer{{after: time.Second, err: ErrBusy}}, 0, 2, ErrBusy, 7 * time.Second},
		{"a branch that is busy, with a wrapped ErrBusy", Config{1, 10 * time.Second, 3, 2 * time.Second},
			[]answer{{after: time.Second, err: fmt.Errorf("Docks: %w", ErrBusy)}, {after: time.Second, copies: 2}},
			2, 2, nil, 4 * time.Second},
		{"a branch that fails for good", Config{1, 10 * time.Second, 3, 5 * time.Second},
			[]answer{{after: time.Second, err: errUnknown}}, 0, 1, errUnknown, time.Second},
		{"a branch whose catalogue says socket closed when its time is up", Config{1, 10 * time.Second, 2, 0},
			[]answer{{hang: true, err: errSocket}}, 0, 2, ErrNoAnswer, 20 * time.Second},
		{"a branch whose catalogue ignores the time limit", Config{1, 10 * time.Second, 1, time.Second},
			[]answer{{after: 12 * time.Second, copies: 5, deaf: true}}, 0, 1, ErrNoAnswer, 12 * time.Second},
		{"a busy branch with no backoff", Config{1, 10 * time.Second, 3, 0},
			[]answer{{after: time.Second, err: ErrBusy}, {after: time.Second, copies: 1}}, 1, 2, nil, 2 * time.Second},
		{"a branch that answers at once with one attempt", Config{3, time.Minute, 1, time.Minute},
			[]answer{{after: 3 * time.Second, copies: 6}}, 6, 1, nil, 3 * time.Second},
	}
	for _, c := range cases {
		synctest.Test(t, func(t *testing.T) {
			var mu sync.Mutex
			calls := 0
			var isbns []string
			cat := CatalogueFunc(func(ctx context.Context, branch, isbn string) (int, error) {
				mu.Lock()
				a := c.answers[min(calls, len(c.answers)-1)]
				calls++
				isbns = append(isbns, isbn)
				mu.Unlock()
				switch {
				case a.deaf:
					time.Sleep(a.after)
					return a.copies, a.err
				case a.hang:
					<-ctx.Done()
					if a.err != nil {
						return 0, a.err
					}
					return 0, ctx.Err()
				}
				select {
				case <-time.After(a.after):
					return a.copies, a.err
				case <-ctx.Done():
					return 0, ctx.Err()
				}
			})
			start := time.Now()
			results, err := StockCheck(context.Background(), cat, "978-1-4028-9462-6", []string{"Docks"}, c.cfg, nil)
			took := time.Since(start)
			mu.Lock()
			made, isbn := calls, ""
			if len(isbns) > 0 {
				isbn = isbns[0]
			}
			mu.Unlock()
			check.NoError(err, "StockCheck of "+c.what+", with a nil tally")
			check.Equal(len(results), 1, "one result for "+c.what)
			r := results[0]
			check.Equal(r.Branch, "Docks", "the result's branch for "+c.what)
			check.Equal(r.Copies, c.copies, "the copies for "+c.what)
			check.Equal(r.Attempts, c.attempts, "the attempts recorded for "+c.what)
			check.Equal(made, c.attempts, "the calls made to the catalogue for "+c.what)
			if c.err == nil {
				check.NoError(r.Err, "the result's error for "+c.what)
			} else {
				check.ErrorIs(r.Err, c.err, "the result's error for "+c.what)
			}
			check.Equal(took, c.took, "how long the check takes for "+c.what+", in fake time")
			check.Equal(isbn, "978-1-4028-9462-6", "the ISBN passed to the catalogue")
		})
	}
}
