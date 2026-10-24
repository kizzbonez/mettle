import (
	"context"
	"errors"
	"strconv"
	"sync"
	"testing/synctest"
	"time"
)

type pressRigKey struct{}

// pressRig fakes the presses: pressing kg kilograms takes kg seconds of fake time and gives
// kg*6/10 litres. It counts the presses started and finished and the most running at once.
type pressRig struct {
	mu                      sync.Mutex
	running, peak           int
	started, finished       int
	sawCoopContext          bool
	jamAt                   int           // a press of this weight jams
	jamAfter, cleanUpOnStop time.Duration // when it jams; how long a stopped press takes to stop
	errJam                  error
}

func (r *pressRig) press(ctx context.Context, kg int) (int, error) {
	r.mu.Lock()
	r.started++
	r.running++
	r.peak = max(r.peak, r.running)
	if ctx.Value(pressRigKey{}) == "co-op" {
		r.sawCoopContext = true
	}
	r.mu.Unlock()
	defer func() {
		r.mu.Lock()
		r.running--
		r.finished++
		r.mu.Unlock()
	}()

	if kg == r.jamAt {
		time.Sleep(r.jamAfter)
		return 0, r.errJam
	}
	select {
	case <-time.After(time.Duration(kg) * time.Second):
		return kg * 6 / 10, nil
	case <-ctx.Done():
		time.Sleep(r.cleanUpOnStop)
		return 0, ctx.Err()
	}
}

func Test(t *testing.T) {
	cases := []struct {
		weights []int
		presses int
		litres  []int
		peak    int
		seconds int
		what    string
	}{
		{[]int{50, 10, 40, 20, 30}, 2, []int{30, 6, 24, 12, 18}, 2, 80, "five crates on two presses"},
		{[]int{50, 10, 40, 20, 30}, 1, []int{30, 6, 24, 12, 18}, 1, 150, "five crates on one press"},
		{[]int{30, 10, 20}, 5, []int{18, 6, 12}, 3, 30, "three crates on five presses"},
		{[]int{10, 20}, 0, []int{6, 12}, 1, 30, "two crates with presses set to 0, which means one"},
		{[]int{10, 20, 30, 40, 50, 60, 70}, 3, []int{6, 12, 18, 24, 30, 36, 42}, 3, 120, "seven crates on three presses"},
	}
	for _, c := range cases {
		synctest.Test(t, func(t *testing.T) {
			rig := &pressRig{}
			ctx := context.WithValue(context.Background(), pressRigKey{}, "co-op")
			start := time.Now()
			litres, err := pressAll(ctx, c.weights, c.presses, rig.press)
			elapsed := time.Since(start)
			check.NoError(err, "pressAll when every press works, for "+c.what)
			check.Equal(litres, c.litres, "the litres in delivery order for "+c.what)
			check.Equal(rig.started, len(c.weights), "how many times press was called for "+c.what)
			check.Equal(rig.peak, c.peak, "the most presses running at the same moment for "+c.what)
			check.Equal(elapsed, time.Duration(c.seconds)*time.Second, "how long pressing takes for "+c.what+", in fake time")
			check.True(rig.sawCoopContext, "press is given a context made from the one pressAll was given")
		})
	}

	synctest.Test(t, func(t *testing.T) {
		rig := &pressRig{}
		litres, err := pressAll(context.Background(), nil, 3, rig.press)
		check.NoError(err, "pressAll with no weights")
		check.Equal(litres, []int{}, "the litres for no weights")
		check.Equal(rig.started, 0, "press is not called when there are no weights")
	})

	synctest.Test(t, func(t *testing.T) {
		errJam := errors.New("apple pulp in the gears")
		rig := &pressRig{jamAt: 13, jamAfter: time.Second, cleanUpOnStop: time.Second, errJam: errJam}
		start := time.Now()
		litres, err := pressAll(context.Background(), []int{10, 13, 20, 30, 40}, 2, rig.press)
		elapsed := time.Since(start)
		check.ErrorIs(err, errJam, "pressAll returns the first error, the jam, not the error of a press it stopped")
		check.True(litres == nil, "pressAll returns nil litres with the error")
		check.Equal(rig.started, 2, "presses started in all: none after the jam ("+strconv.Itoa(rig.started)+" started)")
		check.Equal(rig.finished, rig.started, "every press has finished before pressAll returns")
		check.Equal(elapsed, 2*time.Second, "pressAll stops the other press at the jam, then waits for it to stop, in fake time")
	})

	synctest.Test(t, func(t *testing.T) {
		rig := &pressRig{}
		ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
		defer cancel()
		start := time.Now()
		litres, err := pressAll(ctx, []int{10, 30, 40, 50}, 2, rig.press)
		elapsed := time.Since(start)
		check.Error(err, "pressAll returns an error when its own context runs out")
		check.True(litres == nil, "pressAll returns nil litres when its own context runs out")
		check.Equal(elapsed, 25*time.Second, "pressAll stops as soon as its own context runs out, in fake time")
		check.Equal(rig.finished, rig.started, "every press has finished before pressAll returns")
	})
}
