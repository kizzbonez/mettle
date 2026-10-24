import (
	"context"
	"slices"
	"testing/synctest"
)

// loadedBelt is a belt that already holds its crates and is closed.
func loadedBelt(weights ...int) <-chan int {
	belt := make(chan int, len(weights))
	for _, kg := range weights {
		belt <- kg
	}
	close(belt)
	return belt
}

// endlessBelt sends kg until ctx is done, then closes.
func endlessBelt(ctx context.Context, kg int) <-chan int {
	belt := make(chan int)
	go func() {
		defer close(belt)
		for {
			select {
			case belt <- kg:
			case <-ctx.Done():
				return
			}
		}
	}()
	return belt
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx := context.Background()
		got := []int{}
		for kg := range merge(ctx, loadedBelt(4, 8), loadedBelt(15), loadedBelt(16, 23, 42)) {
			got = append(got, kg)
		}
		slices.Sort(got)
		check.Equal(got, []int{4, 8, 15, 16, 23, 42}, "every crate of three belts comes out of merge, sorted")

		_, open := <-merge(ctx)
		check.True(!open, "merge with no belts gives a channel that is already closed")
		_, open = <-merge(ctx, loadedBelt(), loadedBelt())
		check.True(!open, "merge of two empty belts closes without sending")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx := context.Background()
		late := make(chan int)
		out := merge(ctx, loadedBelt(1, 2), late)
		first := []int{<-out, <-out}
		slices.Sort(first)
		check.Equal(first, []int{1, 2}, "the crates of the belt that is already loaded")
		synctest.Wait()
		select {
		case _, open := <-out:
			check.True(open, "the output stays open while one belt is still open")
			check.Fail("merge sent a crate that no belt carried")
		default:
		}
		late <- 3
		check.Equal(<-out, 3, "a crate that arrives later on the open belt")
		close(late)
		_, open := <-out
		check.True(!open, "the output closes once the last belt closes")
	})

	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		out := merge(ctx, endlessBelt(ctx, 1), endlessBelt(ctx, 2), endlessBelt(ctx, 3))
		for range 5 {
			<-out
		}
		cancel()
		synctest.Wait() // let the copiers react
		_, open := <-out
		check.True(!open, "the output is closed once the context is cancelled, even though nobody reads it")
	})
}
