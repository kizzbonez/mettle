import (
	"sync"
	"testing/synctest"
	"time"
)

// onceEachSensors fakes sensors that answer after one second of fake time, and records how
// often each berth was read and how many sensors were being read at the same moment.
type onceEachSensors struct {
	mu       sync.Mutex
	depths   map[string]int
	calls    map[string]int
	busy     int
	mostBusy int
}

func newOnceEachSensors(depths map[string]int) *onceEachSensors {
	return &onceEachSensors{depths: depths, calls: map[string]int{}}
}

func (s *onceEachSensors) sound(berth string) int {
	s.mu.Lock()
	s.calls[berth]++
	s.busy++
	s.mostBusy = max(s.mostBusy, s.busy)
	s.mu.Unlock()

	time.Sleep(time.Second)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.busy--
	return s.depths[berth]
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		s := newOnceEachSensors(map[string]int{"C1": 410, "C2": 120, "C3": 333, "C4": 87, "C5": 260, "C6": 199})
		start := time.Now()
		got := soundAll([]string{"C6", "C2", "C5", "C1", "C4", "C3"}, s.sound)
		elapsed := time.Since(start)
		check.Equal(got, []int{199, 120, 260, 410, 87, 333}, "the depths of six berths, in the order the berths were given")
		check.Equal(s.calls, map[string]int{"C1": 1, "C2": 1, "C3": 1, "C4": 1, "C5": 1, "C6": 1}, "how many times each of the six sensors was read")
		check.Equal(s.mostBusy, 6, "how many of the six sensors were being read at the same moment")
		check.Equal(s.busy, 0, "how many sensors were still being read when soundAll returned")
		check.Equal(elapsed, time.Second, "how long soundAll takes for six sensors of one second each")

		one := newOnceEachSensors(map[string]int{"D1": 505})
		check.Equal(soundAll([]string{"D1"}, one.sound), []int{505}, "the depth of a single berth")

		none := newOnceEachSensors(map[string]int{})
		check.Equal(soundAll([]string{}, none.sound), []int{}, "the depths of an empty list of berths")
		check.Equal(len(none.calls), 0, "how many sensors are read for an empty list of berths")
	})
}
