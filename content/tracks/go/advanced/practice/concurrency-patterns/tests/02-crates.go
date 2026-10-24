import (
	"context"
	"testing/synctest"
)

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx := context.Background()
		collect := func(weights []int) []int {
			got := []int{}
			for kg := range crates(ctx, weights) {
				got = append(got, kg)
			}
			return got
		}
		check.Equal(collect([]int{5, 0, 0, 7, 3, -1, 9}), []int{5, 7, 3, 9}, "the crates sent, in delivery order, skipping empty ones")
		check.Equal(collect([]int{0, -2, 0}), []int{}, "a delivery of empty crates only sends nothing and closes")
		check.Equal(collect(nil), []int{}, "no weights at all sends nothing and closes")
		check.Equal(collect([]int{42}), []int{42}, "a single crate")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		weights := make([]int, 100)
		for i := range weights {
			weights[i] = i + 1
		}
		ch := crates(ctx, weights)
		check.Equal([]int{<-ch, <-ch, <-ch}, []int{1, 2, 3}, "the first three crates of a long delivery")
		cancel()
		synctest.Wait() // let the source goroutine react
		_, open := <-ch
		check.True(!open, "the channel is closed once the context is cancelled, even though nobody reads the rest")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		ch := crates(ctx, []int{1, 2, 3})
		synctest.Wait()
		_, open := <-ch
		check.True(!open, "with a context that is already cancelled, the channel is closed without sending")
	})
}
