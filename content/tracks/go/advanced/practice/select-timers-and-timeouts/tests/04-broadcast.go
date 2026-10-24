import (
	"testing/synctest"
	"time"
)

// bulletinLog records the lines broadcast sends and when it sends them.
type bulletinLog struct {
	start time.Time
	lines []string
	at    []time.Duration
}

func (b *bulletinLog) send(line string) {
	b.lines = append(b.lines, line)
	b.at = append(b.at, time.Since(b.start))
}

var shippingBulletin = []string{"Dogger: west 5", "Fisher: west 6", "German Bight: northwest 4", "Humber: rain later", "Thames: good"}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		b := &bulletinLog{start: time.Now()}
		sent := broadcast(shippingBulletin, 30*time.Second, nil, b.send)
		check.Equal(sent, 5, "how many lines broadcast sent with no quit signal")
		check.Equal(b.lines, shippingBulletin, "the lines broadcast sent, in order")
		want := []time.Duration{30 * time.Second, time.Minute, 90 * time.Second, 2 * time.Minute, 150 * time.Second}
		check.Equal(b.at, want, "when each line was sent, with a period of 30 s")
		check.Equal(time.Since(b.start), 150*time.Second, "when broadcast returns after the last line")
	})

	synctest.Test(t, func(t *testing.T) {
		quit := make(chan struct{})
		go func() {
			time.Sleep(150 * time.Second)
			close(quit)
		}()
		b := &bulletinLog{start: time.Now()}
		sent := broadcast(shippingBulletin, time.Minute, quit, b.send)
		check.Equal(sent, 2, "how many lines broadcast sent before quit was closed at 2.5 periods")
		check.Equal(b.lines, shippingBulletin[:2], "the lines broadcast sent before quit was closed")
		check.Equal(time.Since(b.start), 150*time.Second, "when broadcast returns after quit is closed between two ticks")
	})

	synctest.Test(t, func(t *testing.T) {
		quit := make(chan struct{})
		close(quit)
		b := &bulletinLog{start: time.Now()}
		check.Equal(broadcast(shippingBulletin, time.Minute, quit, b.send), 0, "how many lines broadcast sends when quit is already closed")
		check.Equal(time.Since(b.start), time.Duration(0), "when broadcast returns if quit is already closed")
	})

	synctest.Test(t, func(t *testing.T) {
		b := &bulletinLog{start: time.Now()}
		check.Equal(broadcast(nil, time.Minute, nil, b.send), 0, "how many lines broadcast sends with no lines")
		check.Equal(len(b.lines), 0, "how many times send is called with no lines")
		check.Equal(time.Since(b.start), time.Duration(0), "when broadcast returns with no lines")
	})
}
