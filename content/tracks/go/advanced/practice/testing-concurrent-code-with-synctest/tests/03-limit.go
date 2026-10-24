import (
	"context"
	"errors"
	"fmt"
	"time"
)

func Test(t *testing.T) {
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
	check.NoError(checkLimit(t, gateWait), "checkLimit accepts gateWait")
	check.NoError(checkLimit(t, afterWait), "checkLimit accepts a correct wait that wraps errLate")
	check.NoError(checkLimit(t, contextWait), "checkLimit accepts a correct wait built on context.WithTimeout")

	// Broken waits: the wrong limit, or the wrong result at the limit.
	withLimit := func(wrong func(time.Duration) time.Duration) waitFunc {
		return func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
			return gateWait(ctx, arrived, wrong(limit))
		}
	}
	nilOnTimeout := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		if err := gateWait(ctx, arrived, limit); !errors.Is(err, errLate) {
			return err
		}
		return nil
	}
	deadlineErr := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		timeout, cancel := context.WithTimeout(ctx, limit)
		defer cancel()
		select {
		case <-arrived:
			return nil
		case <-timeout.Done():
			return timeout.Err()
		}
	}
	half := func(d time.Duration) time.Duration { return d / 2 }
	nanoEarly := func(d time.Duration) time.Duration { return d - time.Nanosecond }
	secondLate := func(d time.Duration) time.Duration { return d + time.Second }
	check.Error(checkLimit(t, withLimit(half)), "checkLimit rejects a wait that gives up at half the limit")
	check.Error(checkLimit(t, withLimit(nanoEarly)), "checkLimit rejects a wait that gives up a nanosecond early")
	check.Error(checkLimit(t, withLimit(secondLate)), "checkLimit rejects a wait that gives up a second late")
	check.Error(checkLimit(t, nilOnTimeout), "checkLimit rejects a wait that returns nil at the limit")
	check.Error(checkLimit(t, deadlineErr), "checkLimit rejects a wait that returns context.DeadlineExceeded instead of errLate")
}
