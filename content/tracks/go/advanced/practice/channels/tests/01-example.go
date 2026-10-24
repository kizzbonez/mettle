import (
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	// Inside synctest.Test the clock is fake: the hour below passes only if everything else is stuck.
	synctest.Test(t, func(t *testing.T) {
		drum := loadDrum([]int{7, 42, 75, 16})
		synctest.Wait()
		check.Equal(len(drum), 4, "len of the drum loaded with four balls")
		check.Equal(cap(drum), 4, "cap of the drum loaded with four balls")

		called := make(chan []string, 1)
		go func() {
			var calls []string
			for call := range announce(drum) {
				calls = append(calls, call)
			}
			called <- calls
		}()
		select {
		case calls := <-called:
			check.Equal(calls, []string{"B 7", "N 42", "O 75", "I 16"}, "the calls for the balls 7, 42, 75 and 16")
		case <-time.After(time.Hour):
			check.Fail("for range over announce(drum) ends after the last ball")
		}

		calls := announce(loadDrum([]int{7, 42, 75, 16}))
		check.Equal(markCard(calls, []string{"N 42", "B 7"}), 2, `markCard(calls, []string{"N 42", "B 7"})`)
	})
}
