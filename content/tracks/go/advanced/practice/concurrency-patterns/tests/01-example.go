import (
	"context"
	"errors"
	"slices"
	"testing/synctest"
)

func Test(t *testing.T) {
	// Inside synctest.Test the clock is fake, and a goroutine left blocked fails the test.
	synctest.Test(t, func(t *testing.T) {
		ctx := context.Background()

		var sent []int
		for kg := range crates(ctx, []int{120, 0, 80, -5, 60}) {
			sent = append(sent, kg)
		}
		check.Equal(sent, []int{120, 80, 60}, "what crates sends for the weights {120, 0, 80, -5, 60}")

		var merged []int
		for kg := range merge(ctx, crates(ctx, []int{10, 20}), crates(ctx, []int{30})) {
			merged = append(merged, kg)
		}
		slices.Sort(merged)
		check.Equal(merged, []int{10, 20, 30}, "what merge passes on from the belts {10, 20} and {30}, sorted")

		juice := func(ctx context.Context, kg int) (int, error) {
			return kg * 6 / 10, nil
		}
		litres, err := pressAll(ctx, []int{120, 80, 60}, 2, juice)
		check.NoError(err, "pressAll(ctx, {120, 80, 60}, 2, juice) when every press works")
		check.Equal(litres, []int{72, 48, 36}, "the litres from pressAll(ctx, {120, 80, 60}, 2, juice)")

		errJammed := errors.New("press jammed")
		jammed := func(ctx context.Context, kg int) (int, error) {
			if kg == 80 {
				return 0, errJammed
			}
			return juice(ctx, kg)
		}
		litres, err = pressAll(ctx, []int{120, 80, 60}, 2, jammed)
		check.ErrorIs(err, errJammed, "the error from pressAll when the press for 80 kg jams")
		check.True(litres == nil, "pressAll returns nil litres together with an error")
	})
}
