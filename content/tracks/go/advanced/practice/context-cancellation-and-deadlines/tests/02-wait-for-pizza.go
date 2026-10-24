import (
	"context"
	"errors"
	"testing/synctest"
	"time"
)

// waitWithin runs waitForPizza and fails the test if it is still waiting a day (of the fake
// clock) after its context ended.
func waitWithin(ctx context.Context, oven <-chan string, what string) (string, error) {
	type result struct {
		pizza string
		err   error
	}
	done := make(chan result, 1)
	go func() {
		pizza, err := waitForPizza(ctx, oven)
		done <- result{pizza, err}
	}()
	select {
	case r := <-done:
		return r.pizza, r.err
	case <-time.After(24 * time.Hour):
		check.Fail("waitForPizza returns as soon as its context ends, " + what)
		return "", nil
	}
}

// ovenAfter returns an oven that delivers pizza after d. Its buffer lets the oven finish even
// when nobody is waiting any more.
func ovenAfter(d time.Duration, pizza string) <-chan string {
	oven := make(chan string, 1)
	go func() {
		time.Sleep(d)
		oven <- pizza
	}()
	return oven
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ready := make(chan string, 1)
		ready <- "marinara"
		start := time.Now()
		pizza, err := waitWithin(context.Background(), ready, "with a pizza already waiting")
		check.NoError(err, "waitForPizza with a pizza already waiting")
		check.Equal(pizza, "marinara", "the pizza that was already waiting")
		check.Equal(time.Since(start), time.Duration(0), "when waitForPizza returns with a pizza already waiting")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		go func() {
			time.Sleep(2 * time.Minute)
			cancel()
		}()
		start := time.Now()
		pizza, err := waitWithin(ctx, make(chan string), "when the order is cancelled")
		check.ErrorIs(err, context.Canceled, "the error when the order is cancelled at 2 min")
		check.True(!errors.Is(err, context.DeadlineExceeded), "a cancelled order is not reported as a missed deadline")
		check.Equal(pizza, "", "the pizza when the order is cancelled")
		check.Equal(time.Since(start), 2*time.Minute, "when waitForPizza returns, with the order cancelled at 2 min")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		start := time.Now()
		pizza, err := waitWithin(ctx, ovenAfter(4*time.Minute, "funghi"), "with the pizza ready before the deadline")
		check.NoError(err, "waitForPizza when the pizza is ready a minute before the deadline")
		check.Equal(pizza, "funghi", "the pizza ready a minute before the deadline")
		check.Equal(time.Since(start), 4*time.Minute, "when waitForPizza returns for a pizza ready at 4 min")
	})

	synctest.Test(t, func(t *testing.T) {
		start := time.Now()
		ctx, cancel := context.WithDeadline(context.Background(), start.Add(6*time.Minute))
		defer cancel()
		pizza, err := waitWithin(ctx, ovenAfter(9*time.Minute, "calzone"), "with the pizza ready only after the deadline")
		check.ErrorIs(err, context.DeadlineExceeded, "the error when the deadline passes before the pizza is ready")
		check.Equal(pizza, "", "the pizza when the deadline passes first")
		check.Equal(time.Since(start), 6*time.Minute, "when waitForPizza returns, with a deadline at 6 min")
		time.Sleep(time.Hour) // let the late oven finish
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancelCause(context.Background())
		go func() {
			time.Sleep(time.Minute)
			cancel(errors.New("the market is closing"))
		}()
		_, err := waitWithin(ctx, make(chan string), "when the order is cancelled with a cause")
		check.ErrorIs(err, context.Canceled, "the error waitForPizza returns when the order is cancelled with a cause")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		start := time.Now()
		_, err := waitWithin(ctx, make(chan string), "when the order was cancelled before the call")
		check.ErrorIs(err, context.Canceled, "the error when the order was cancelled before the call")
		check.Equal(time.Since(start), time.Duration(0), "when waitForPizza returns if the order was already cancelled")
	})
}
