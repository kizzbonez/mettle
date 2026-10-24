import (
	"context"
	"testing/synctest"
	"time"
)

// exampleBake returns a bake that takes d and honours its context.
func exampleBake(d time.Duration, pizza string) func(context.Context) (string, error) {
	return func(ctx context.Context) (string, error) {
		select {
		case <-time.After(d):
			return pizza, nil
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}
}

func Test(t *testing.T) {
	// Inside synctest.Test the clock is fake: the minutes below take no real time.
	synctest.Test(t, func(t *testing.T) {
		start := time.Now()
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()
		oven := make(chan string)
		go func() {
			time.Sleep(3 * time.Minute)
			oven <- "margherita"
		}()
		pizza, err := waitForPizza(ctx, oven)
		check.NoError(err, "waitForPizza when the oven delivers at 3 min")
		check.Equal(pizza, "margherita", "the pizza waitForPizza returns")
		check.Equal(time.Since(start), 3*time.Minute, "when waitForPizza returns, with the oven delivering at 3 min")

		pizza, err = waitForPizza(ctx, make(chan string))
		check.ErrorIs(err, context.DeadlineExceeded, "waitForPizza when the oven stays quiet until the deadline")
		check.Equal(pizza, "", "the pizza waitForPizza returns when the deadline passes")
		check.Equal(time.Since(start), 10*time.Minute, "when waitForPizza returns, with a deadline 10 min after the start")

		start = time.Now()
		pizza, err = bakeWithin(context.Background(), 10*time.Minute, exampleBake(8*time.Minute, "diavola"))
		check.NoError(err, "bakeWithin with a limit of 10 min for a bake of 8 min")
		check.Equal(pizza, "diavola", "the pizza bakeWithin returns")
		check.Equal(time.Since(start), 8*time.Minute, "when bakeWithin returns for a bake of 8 min")

		start = time.Now()
		pizza, err = bakeWithin(context.Background(), 10*time.Minute, exampleBake(12*time.Minute, "quattro formaggi"))
		check.ErrorIs(err, ErrTooSlow, "bakeWithin with a limit of 10 min for a bake of 12 min")
		check.Equal(pizza, "", "the pizza bakeWithin returns when the bake is too slow")
		check.Equal(time.Since(start), 10*time.Minute, "when bakeWithin returns for a bake that is too slow")

		ticket, ok := ticketFrom(withTicket(context.Background(), 42))
		check.True(ok, "ticketFrom(withTicket(context.Background(), 42)) finds a ticket")
		check.Equal(ticket, 42, "the ticket ticketFrom(withTicket(context.Background(), 42)) returns")
		_, ok = ticketFrom(context.Background())
		check.True(!ok, "ticketFrom(context.Background())")
	})
}
