import (
	"context"
	"fmt"
	"time"
)

func Test(t *testing.T) {
	// Correct waits, written in three different ways.
	afterWait := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		select {
		case <-arrived:
			return nil
		case <-time.After(limit):
			return fmt.Errorf("gate: %w", errLate)
		case <-ctx.Done():
			return fmt.Errorf("gate closed: %w", ctx.Err())
		}
	}
	contextWait := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		timeout, cancel := context.WithTimeout(ctx, limit)
		defer cancel()
		select {
		case <-arrived:
			return nil
		case <-timeout.Done():
			if err := ctx.Err(); err != nil {
				return err
			}
			return errLate
		}
	}
	check.NoError(checkArrival(t, gateWait), "checkArrival accepts gateWait")
	check.NoError(checkArrival(t, afterWait), "checkArrival accepts a correct wait built on time.After that wraps its errors")
	check.NoError(checkArrival(t, contextWait), "checkArrival accepts a correct wait built on context.WithTimeout")

	// Broken waits.
	ignoresArrival := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		select {
		case <-time.After(limit):
			return errLate
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	polling := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		for waited := time.Duration(0); waited < limit; waited += time.Minute {
			select {
			case <-arrived:
				return nil
			case <-ctx.Done():
				return ctx.Err()
			default:
			}
			time.Sleep(time.Minute) // looks at the gate once a minute only
		}
		return errLate
	}
	wrongResult := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		select {
		case <-arrived:
			return errLate
		case <-time.After(limit):
			return errLate
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	shortWait := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		return gateWait(ctx, arrived, 3*time.Minute)
	}
	leavesEarly := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		time.Sleep(time.Minute)
		return nil // as if someone had come
	}
	check.Error(checkArrival(t, leavesEarly), "checkArrival rejects a wait that returns nil before anyone arrives")
	check.Error(checkArrival(t, ignoresArrival), "checkArrival rejects a wait that does not notice the arrival")
	check.Error(checkArrival(t, polling), "checkArrival rejects a wait that notices the arrival only up to a minute later")
	check.Error(checkArrival(t, wrongResult), "checkArrival rejects a wait that returns an error when the grown-up arrives")
	check.Error(checkArrival(t, shortWait), "checkArrival rejects a wait that gives up before the grown-up arrives")
}
