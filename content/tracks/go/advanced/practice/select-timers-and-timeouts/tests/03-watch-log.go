import (
	"testing/synctest"
	"time"
)

// scriptedMessage is one message of a radio script: what is said, and how many seconds after
// the start.
type scriptedMessage struct {
	second int
	text   string
}

// playScript sends the script's messages on a new channel at their times and closes the
// channel at closeAt seconds.
func playScript(script []scriptedMessage, closeAt int) <-chan string {
	ch := make(chan string)
	go func() {
		start := time.Now()
		for _, m := range script {
			time.Sleep(time.Duration(m.second)*time.Second - time.Since(start))
			ch <- m.text
		}
		time.Sleep(time.Duration(closeAt)*time.Second - time.Since(start))
		close(ch)
	}()
	return ch
}

// watchLogWithin runs watchLog and fails the test if it has not returned after an hour of the
// fake clock.
func watchLogWithin(coastguard, harbour <-chan string, what string) []string {
	done := make(chan []string, 1)
	go func() {
		done <- watchLog(coastguard, harbour)
	}()
	select {
	case entries := <-done:
		return entries
	case <-time.After(time.Hour):
		check.Fail("watchLog returns once both channels are closed, " + what)
		return nil
	}
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		coastguard := playScript([]scriptedMessage{{1, "gale warning"}, {4, "swimmer reported"}}, 5)
		harbour := playScript([]scriptedMessage{{2, "dredger at the bar"}, {3, "pilot boarding"}}, 3)
		start := time.Now()
		entries := watchLogWithin(coastguard, harbour, "with calls on both channels")
		want := []string{"coastguard: gale warning", "harbour: dredger at the bar", "harbour: pilot boarding", "coastguard: swimmer reported"}
		check.Equal(entries, want, "the log when the harbour closes before the coastguard's last call")
		check.Equal(time.Since(start), 5*time.Second, "when watchLog returns, with the last channel closed at 5 s")
	})

	synctest.Test(t, func(t *testing.T) {
		coastguard := playScript([]scriptedMessage{{2, "radio check"}}, 2)
		harbour := playScript([]scriptedMessage{{1, "berth 7 free"}, {6, "bridge opening"}}, 8)
		entries := watchLogWithin(coastguard, harbour, "when the coastguard closes first")
		check.Equal(entries, []string{"harbour: berth 7 free", "coastguard: radio check", "harbour: bridge opening"}, "the log when the coastguard closes first")
	})

	synctest.Test(t, func(t *testing.T) {
		closed := make(chan string)
		close(closed)
		harbour := playScript([]scriptedMessage{{1, "tide high at 14:10"}, {2, "tide low at 20:25"}}, 3)
		entries := watchLogWithin(closed, harbour, "when one channel is closed from the start")
		check.Equal(entries, []string{"harbour: tide high at 14:10", "harbour: tide low at 20:25"}, "the log when the coastguard channel is closed from the start")
	})

	synctest.Test(t, func(t *testing.T) {
		a := make(chan string)
		b := make(chan string)
		close(a)
		close(b)
		entries := watchLogWithin(a, b, "when both channels are closed from the start")
		check.Equal(len(entries), 0, "how many log entries there are when both channels are closed from the start")
	})
}
