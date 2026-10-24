import (
	"sync"
	"testing/synctest"
	"time"
)

// slowSensors fakes sensors that each take their own number of seconds of fake time to
// answer, and records how many are being read at the same moment.
type slowSensors struct {
	mu       sync.Mutex
	seconds  map[string]int
	depths   map[string]int
	busy     int
	mostBusy int
}

func newSlowSensors() *slowSensors {
	return &slowSensors{
		seconds: map[string]int{"F1": 1, "F2": 5, "F3": 1, "F4": 1, "F5": 1, "F6": 5},
		depths:  map[string]int{"F1": 220, "F2": 45, "F3": 380, "F4": 150, "F5": 290, "F6": 60},
	}
}

func (s *slowSensors) sound(berth string) int {
	s.mu.Lock()
	s.busy++
	s.mostBusy = max(s.mostBusy, s.busy)
	wait := time.Duration(s.seconds[berth]) * time.Second
	s.mu.Unlock()

	time.Sleep(wait)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.busy--
	return s.depths[berth]
}

func Test(t *testing.T) {
	berths := []string{"F1", "F2", "F3", "F4", "F5", "F6"}
	want := []int{220, 45, 380, 150, 290, 60}

	synctest.Test(t, func(t *testing.T) {
		s := newSlowSensors()
		start := time.Now()
		got := soundAll(berths, s.sound)
		check.Equal(time.Since(start), 5*time.Second, "how long soundAll takes when the slowest sensor needs five seconds")
		check.Equal(got, want, "the depths from soundAll when some sensors are slow")
		check.Equal(s.busy, 0, "how many sensors were still being read when soundAll returned")
	})

	synctest.Test(t, func(t *testing.T) {
		s := newSlowSensors()
		start := time.Now()
		got := soundInRounds(berths, 3, s.sound)
		check.Equal(time.Since(start), 10*time.Second, "how long two rounds of three take when each round has a five-second sensor")
		check.Equal(got, want, "the depths from soundInRounds when some sensors are slow")
		check.Equal(s.mostBusy, 3, "the most sensors read at the same moment, three at a time, with slow sensors")
		check.Equal(s.busy, 0, "how many sensors were still being read when soundInRounds returned")
	})

	synctest.Test(t, func(t *testing.T) {
		s := newSlowSensors()
		start := time.Now()
		check.Equal(soundInRounds(berths, 2, s.sound), want, "the depths read two at a time when some sensors are slow")
		check.Equal(time.Since(start), 11*time.Second, "how long three rounds of two take with a slow sensor in the first and last")
	})
}
