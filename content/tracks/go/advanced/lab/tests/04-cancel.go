import (
	"context"
	"errors"
	"sync"
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	errClosing := errors.New("the library is closing")
	// A catalogue that hangs for the branches in silent, is busy for the branches in busy,
	// and otherwise answers 2 copies after 10 s. It records the fake time of every call.
	type log struct {
		mu     sync.Mutex
		starts []time.Duration
	}
	catalogue := func(l *log, start time.Time, silent, busy map[string]bool) Catalogue {
		return CatalogueFunc(func(ctx context.Context, branch, isbn string) (int, error) {
			l.mu.Lock()
			l.starts = append(l.starts, time.Since(start))
			l.mu.Unlock()
			if silent[branch] {
				<-ctx.Done()
				return 0, ctx.Err()
			}
			if busy[branch] {
				return 0, ErrBusy
			}
			select {
			case <-time.After(10 * time.Second):
				return 2, nil
			case <-ctx.Done():
				return 0, ctx.Err()
			}
		})
	}
	everyone := []string{"A", "B", "C", "D", "E"}
	all := map[string]bool{"A": true, "B": true, "C": true, "D": true, "E": true}

	// Cancelled in the middle of the first calls: StockCheck returns at once with the cause.
	synctest.Test(t, func(t *testing.T) {
		l := &log{}
		start := time.Now()
		ctx, cancel := context.WithCancelCause(context.Background())
		time.AfterFunc(15*time.Second, func() { cancel(errClosing) })
		var tally Tally
		cfg := Config{Workers: 2, Timeout: 30 * time.Second, Attempts: 3, Backoff: 20 * time.Second}
		results, err := StockCheck(ctx, catalogue(l, start, all, nil), "isbn", everyone, cfg, &tally)
		took := time.Since(start)
		check.ErrorIs(err, errClosing, "StockCheck returns context.Cause(ctx) when it is cancelled with a cause")
		check.True(results == nil, "StockCheck returns nil results when it is cancelled")
		check.Equal(took, 15*time.Second, "StockCheck returns as soon as it is cancelled, in fake time")
		l.mu.Lock()
		check.Equal(l.starts, []time.Duration{0, 0}, "the calls made: two at the start, none after the cancel")
		l.mu.Unlock()
		check.Equal(tally.Counts(), Counts{}, "branches cut short by the cancel are not counted in the tally")
	})

	// Cancelled while waiting to call a busy branch again: the wait ends at once.
	synctest.Test(t, func(t *testing.T) {
		l := &log{}
		start := time.Now()
		ctx, cancel := context.WithCancel(context.Background())
		time.AfterFunc(30*time.Second, cancel)
		cfg := Config{Workers: 1, Timeout: 10 * time.Second, Attempts: 3, Backoff: time.Minute}
		_, err := StockCheck(ctx, catalogue(l, start, nil, map[string]bool{"A": true}), "isbn", []string{"A", "B"}, cfg, nil)
		took := time.Since(start)
		check.ErrorIs(err, context.Canceled, "StockCheck returns context.Canceled when it is cancelled during a backoff wait")
		check.Equal(took, 30*time.Second, "a backoff wait ends as soon as the context is cancelled, in fake time")
		l.mu.Lock()
		check.Equal(len(l.starts), 1, "no call is made after the cancel")
		l.mu.Unlock()
	})

	// The caller's deadline passes: finished branches are in the tally, the cut one is not.
	synctest.Test(t, func(t *testing.T) {
		l := &log{}
		start := time.Now()
		ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
		defer cancel()
		var tally Tally
		cfg := Config{Workers: 1, Timeout: 30 * time.Second, Attempts: 1, Backoff: 0}
		results, err := StockCheck(ctx, catalogue(l, start, map[string]bool{"C": true}, nil), "isbn", []string{"A", "B", "C", "D"}, cfg, &tally)
		check.ErrorIs(err, context.DeadlineExceeded, "StockCheck returns context.DeadlineExceeded when the caller's deadline passes")
		check.True(results == nil, "StockCheck returns nil results when the caller's deadline passes")
		check.Equal(time.Since(start), 25*time.Second, "StockCheck returns at the caller's deadline, in fake time")
		check.Equal(tally.Counts(), Counts{InStock: 2}, "the tally holds the two branches that finished before the deadline")
	})

	// Already cancelled: no call at all.
	synctest.Test(t, func(t *testing.T) {
		l := &log{}
		ctx, cancel := context.WithCancelCause(context.Background())
		cancel(errClosing)
		cfg := Config{Workers: 3, Timeout: 30 * time.Second, Attempts: 3, Backoff: time.Second}
		results, err := StockCheck(ctx, catalogue(l, time.Now(), nil, nil), "isbn", everyone, cfg, nil)
		check.ErrorIs(err, errClosing, "StockCheck with a context that is already cancelled returns its cause")
		check.True(results == nil, "StockCheck with a context that is already cancelled returns nil results")
		l.mu.Lock()
		check.Equal(len(l.starts), 0, "no branch is called when the context is already cancelled")
		l.mu.Unlock()
	})
}
