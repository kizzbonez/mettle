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
	check.NoError(checkCancel(t, gateWait), "checkCancel accepts gateWait")
	check.NoError(checkCancel(t, afterWait), "checkCancel accepts a correct wait that wraps the context's error")
	check.NoError(checkCancel(t, contextWait), "checkCancel accepts a correct wait built on context.WithTimeout")

	// Broken waits.
	deaf := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		select {
		case <-arrived:
			return nil
		case <-time.After(limit):
			return errLate
		}
	}
	nilOnCancel := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		if err := gateWait(ctx, arrived, limit); errors.Is(err, errLate) {
			return err
		}
		return nil
	}
	lateOnCancel := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		select {
		case <-arrived:
			return nil
		case <-time.After(limit):
			return errLate
		case <-ctx.Done():
			return errLate
		}
	}
	shortWait := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		return gateWait(ctx, arrived, 2*time.Minute)
	}
	cancelledTooSoon := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		time.Sleep(time.Minute)
		return context.Canceled // as if it had been cancelled
	}
	check.Error(checkCancel(t, cancelledTooSoon), "checkCancel rejects a wait that returns context.Canceled before it is cancelled")
	check.Error(checkCancel(t, deaf), "checkCancel rejects a wait that never looks at its context")
	check.Error(checkCancel(t, nilOnCancel), "checkCancel rejects a wait that returns nil when cancelled")
	check.Error(checkCancel(t, lateOnCancel), "checkCancel rejects a wait that returns errLate when cancelled")
	check.Error(checkCancel(t, shortWait), "checkCancel rejects a wait that gives up before it is cancelled")
}
