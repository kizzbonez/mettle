import (
	"testing/synctest"
	"time"
)

// radioAfter returns a channel on which msg arrives after delay. Its buffer lets the sender
// finish even when nobody receives any more.
func radioAfter(delay time.Duration, msg string) <-chan string {
	ch := make(chan string, 1)
	go func() {
		time.Sleep(delay)
		ch <- msg
	}()
	return ch
}

func Test(t *testing.T) {
	cases := []struct {
		coastguardAt, harbourAt time.Duration // 0 means that channel stays silent
		limit, returnsAt        time.Duration
		call                    string
		quiet                   bool
		what                    string
	}{
		{3 * time.Second, 0, 10 * time.Second, 3 * time.Second, "coastguard: mayday relay", false, "a coastguard call before the limit"},
		{0, 9 * time.Second, 10 * time.Second, 9 * time.Second, "harbour: pilot boarding", false, "a harbour call just before the limit"},
		{6 * time.Second, 4 * time.Second, 10 * time.Second, 4 * time.Second, "harbour: pilot boarding", false, "calls on both channels, the harbour first"},
		{2 * time.Second, 5 * time.Second, 10 * time.Second, 2 * time.Second, "coastguard: mayday relay", false, "calls on both channels, the coastguard first"},
		{0, 0, 30 * time.Second, 30 * time.Second, "", true, "no calls at all, with a limit of 30 s"},
		{7 * time.Second, 8 * time.Second, 5 * time.Second, 5 * time.Second, "", true, "calls that come only after the limit"},
	}
	for _, c := range cases {
		synctest.Test(t, func(t *testing.T) {
			var coastguard, harbour <-chan string = make(chan string), make(chan string)
			if c.coastguardAt > 0 {
				coastguard = radioAfter(c.coastguardAt, "mayday relay")
			}
			if c.harbourAt > 0 {
				harbour = radioAfter(c.harbourAt, "pilot boarding")
			}
			start := time.Now()
			call, err := firstCall(coastguard, harbour, c.limit)
			check.Equal(time.Since(start), c.returnsAt, "when firstCall returns, for "+c.what)
			if c.quiet {
				check.ErrorIs(err, ErrQuiet, "the error firstCall returns for "+c.what)
			} else {
				check.NoError(err, "the error firstCall returns for "+c.what)
			}
			check.Equal(call, c.call, "the call firstCall returns for "+c.what)
			// Let any later call finish before the bubble ends.
			time.Sleep(time.Hour)
		})
	}

	synctest.Test(t, func(t *testing.T) {
		waiting := make(chan string, 1)
		waiting <- "tug standing by"
		start := time.Now()
		call, err := firstCall(make(chan string), waiting, time.Minute)
		check.NoError(err, "firstCall when a message is already waiting")
		check.Equal(call, "harbour: tug standing by", "the call firstCall returns when a message is already waiting")
		check.Equal(time.Since(start), time.Duration(0), "when firstCall returns if a message is already waiting")
	})
}
