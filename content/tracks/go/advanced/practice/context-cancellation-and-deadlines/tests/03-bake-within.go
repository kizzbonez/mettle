import (
	"context"
	"errors"
	"testing/synctest"
	"time"
)

var errNoDough = errors.New("out of dough")

// recordedBake is a bake that takes a set time, honours its context, and remembers the
// context it was given.
type recordedBake struct {
	takes time.Duration
	pizza string
	fail  error // returned instead of a pizza after takes, if set
	ctx   context.Context
}

func (b *recordedBake) bake(ctx context.Context) (string, error) {
	b.ctx = ctx
	select {
	case <-time.After(b.takes):
		if b.fail != nil {
			return "", b.fail
		}
		return b.pizza, nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		b := &recordedBake{takes: 8 * time.Minute, pizza: "capricciosa"}
		start := time.Now()
		pizza, err := bakeWithin(context.Background(), 10*time.Minute, b.bake)
		check.NoError(err, "bakeWithin for a bake that finishes within the limit")
		check.Equal(pizza, "capricciosa", "the pizza from a bake that finishes within the limit")
		check.Equal(time.Since(start), 8*time.Minute, "when bakeWithin returns for a bake of 8 min")
		check.True(b.ctx != nil, "bakeWithin calls bake")
		deadline, ok := b.ctx.Deadline()
		check.True(ok, "the context given to bake has a deadline")
		check.Equal(deadline, start.Add(10*time.Minute), "the deadline of the context given to bake, with a limit of 10 min")
		check.ErrorIs(b.ctx.Err(), context.Canceled, "the context given to bake is cancelled by the time bakeWithin returns")
	})

	synctest.Test(t, func(t *testing.T) {
		b := &recordedBake{takes: 15 * time.Minute, pizza: "napoletana"}
		start := time.Now()
		pizza, err := bakeWithin(context.Background(), 6*time.Minute, b.bake)
		check.ErrorIs(err, ErrTooSlow, "the error when the bake runs past the limit")
		check.True(!errors.Is(err, context.DeadlineExceeded), "the error for a bake past the limit is the cause, not the plain context error")
		check.Equal(pizza, "", "the pizza when the bake runs past the limit")
		check.Equal(time.Since(start), 6*time.Minute, "when bakeWithin returns, with a limit of 6 min")
	})

	synctest.Test(t, func(t *testing.T) {
		b := &recordedBake{takes: 2 * time.Minute, fail: errNoDough}
		pizza, err := bakeWithin(context.Background(), 10*time.Minute, b.bake)
		check.ErrorIs(err, errNoDough, "the bake's own error, returned before the limit")
		check.True(!errors.Is(err, ErrTooSlow), "a bake that fails on its own is not reported as too slow")
		check.Equal(pizza, "", "the pizza when the bake fails on its own")
	})

	synctest.Test(t, func(t *testing.T) {
		errClosing := errors.New("the market is closing")
		ctx, cancel := context.WithCancelCause(context.Background())
		go func() {
			time.Sleep(3 * time.Minute)
			cancel(errClosing)
		}()
		b := &recordedBake{takes: 8 * time.Minute, pizza: "prosciutto"}
		start := time.Now()
		pizza, err := bakeWithin(ctx, 10*time.Minute, b.bake)
		check.ErrorIs(err, errClosing, "the error when the caller's context is cancelled with a cause during the bake")
		check.Equal(pizza, "", "the pizza when the caller's context is cancelled during the bake")
		check.Equal(time.Since(start), 3*time.Minute, "when bakeWithin returns, with the caller's context cancelled at 3 min")
	})

	synctest.Test(t, func(t *testing.T) {
		start := time.Now()
		ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
		defer cancel()
		b := &recordedBake{takes: 8 * time.Minute, pizza: "romana"}
		pizza, err := bakeWithin(ctx, 10*time.Minute, b.bake)
		check.ErrorIs(err, context.DeadlineExceeded, "the error when the caller's own deadline comes before the limit")
		check.True(!errors.Is(err, ErrTooSlow), "a missed caller deadline is not reported as the bake's own limit")
		check.Equal(pizza, "", "the pizza when the caller's deadline comes first")
		check.Equal(time.Since(start), 4*time.Minute, "when bakeWithin returns, with the caller's deadline at 4 min")
		deadline, _ := b.ctx.Deadline()
		check.Equal(deadline, start.Add(4*time.Minute), "the deadline given to bake when the caller's deadline is earlier")
	})
}
