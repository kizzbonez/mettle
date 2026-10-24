import (
	"context"
	"time"
)

func Test(t *testing.T) {
	check.NoError(checkArrival(t, gateWait), "checkArrival(t, gateWait) accepts the school's wait")
	check.NoError(checkLimit(t, gateWait), "checkLimit(t, gateWait) accepts the school's wait")
	check.NoError(checkCancel(t, gateWait), "checkCancel(t, gateWait) accepts the school's wait")

	impatient := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		return nil
	}
	check.Error(checkArrival(t, impatient), "checkArrival(t, impatient) rejects a wait that returns at once")
	check.Error(checkLimit(t, impatient), "checkLimit(t, impatient) rejects a wait that returns at once")
	check.Error(checkCancel(t, impatient), "checkCancel(t, impatient) rejects a wait that returns at once")

	deaf := func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
		return gateWait(context.Background(), arrived, limit)
	}
	check.NoError(checkArrival(t, deaf), "checkArrival(t, deaf) accepts a wait that only forgets its context")
	check.NoError(checkLimit(t, deaf), "checkLimit(t, deaf) accepts a wait that only forgets its context")
	check.Error(checkCancel(t, deaf), "checkCancel(t, deaf) rejects a wait that forgets its context")
}
