import (
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	// Inside synctest.Test the clock is fake: the seconds and minutes below take no real time.
	synctest.Test(t, func(t *testing.T) {
		coastguard := make(chan string)
		harbour := make(chan string)
		go func() {
			time.Sleep(2 * time.Second)
			harbour <- "ferry leaving berth 3"
		}()
		start := time.Now()
		call, err := firstCall(coastguard, harbour, 10*time.Second)
		check.NoError(err, "firstCall when the harbour calls after 2 s, with a limit of 10 s")
		check.Equal(call, "harbour: ferry leaving berth 3", "the call firstCall returns")
		check.Equal(time.Since(start), 2*time.Second, "when firstCall returns, after a call at 2 s")

		start = time.Now()
		call, err = firstCall(coastguard, harbour, 5*time.Second)
		check.ErrorIs(err, ErrQuiet, "firstCall when nothing is sent, with a limit of 5 s")
		check.Equal(call, "", "the call firstCall returns when nothing is sent")
		check.Equal(time.Since(start), 5*time.Second, "when firstCall gives up, with a limit of 5 s")

		cg := make(chan string)
		hb := make(chan string)
		go func() {
			time.Sleep(time.Second)
			cg <- "gale warning"
			time.Sleep(2 * time.Second)
			close(cg)
		}()
		go func() {
			time.Sleep(2 * time.Second)
			hb <- "dredger at the bar"
			close(hb)
		}()
		start = time.Now()
		entries := watchLog(cg, hb)
		check.Equal(entries, []string{"coastguard: gale warning", "harbour: dredger at the bar"}, "the log from watchLog")
		check.Equal(time.Since(start), 3*time.Second, "when watchLog returns, with the last channel closed at 3 s")

		var heard []string
		var at []time.Duration
		start = time.Now()
		sent := broadcast([]string{"wind NW 5", "sea moderate", "visibility good"}, time.Minute, nil, func(line string) {
			heard = append(heard, line)
			at = append(at, time.Since(start))
		})
		check.Equal(sent, 3, "how many lines broadcast says it sent")
		check.Equal(heard, []string{"wind NW 5", "sea moderate", "visibility good"}, "the lines broadcast sent")
		check.Equal(at, []time.Duration{time.Minute, 2 * time.Minute, 3 * time.Minute}, "when each line was sent, with a period of 1 min")
		check.Equal(time.Since(start), 3*time.Minute, "when broadcast returns")
	})
}
