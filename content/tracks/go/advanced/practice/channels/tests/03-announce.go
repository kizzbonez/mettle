import (
	"testing/synctest"
	"time"
)

// startAnnounce calls announce in its own goroutine and fails the test unless it returns at
// once, before any ball has been handed over.
func startAnnounce(balls <-chan int) <-chan string {
	returned := make(chan (<-chan string), 1)
	go func() {
		returned <- announce(balls)
	}()
	synctest.Wait()
	select {
	case calls := <-returned:
		return calls
	default:
		check.Fail("announce returns at once, before anyone has read a call")
		return nil
	}
}

// collectCalls receives every call in a goroutine and fails the test if the calls channel is
// still open an hour (of the test's fake clock) after the last ball.
func collectCalls(calls <-chan string) []string {
	collected := make(chan []string, 1)
	go func() {
		var got []string
		for call := range calls {
			got = append(got, call)
		}
		collected <- got
	}()
	select {
	case got := <-collected:
		return got
	case <-time.After(time.Hour):
		check.Fail("the channel announce returns is closed after the last ball")
		return nil
	}
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		// The test hands the balls over one at a time, a second apart, on an unbuffered channel.
		balls := make(chan int)
		calls := startAnnounce(balls)
		check.Equal(cap(calls), 0, "the capacity of the channel announce returns")
		go func() {
			for _, ball := range []int{1, 15, 16, 30, 31, 45, 46, 60, 61, 75} {
				time.Sleep(time.Second)
				balls <- ball
			}
			close(balls)
		}()
		want := []string{"B 1", "B 15", "I 16", "I 30", "N 31", "N 45", "G 46", "G 60", "O 61", "O 75"}
		check.Equal(collectCalls(calls), want, "the calls for the first and last ball of every column")

		single := make(chan int, 1)
		single <- 9
		close(single)
		check.Equal(collectCalls(startAnnounce(single)), []string{"B 9"}, "the calls for a drum of one ball")

		none := make(chan int)
		close(none)
		check.Equal(len(collectCalls(startAnnounce(none))), 0, "how many calls are made when the drum is empty")
	})
}
