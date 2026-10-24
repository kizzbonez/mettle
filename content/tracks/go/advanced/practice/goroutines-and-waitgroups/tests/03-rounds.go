import (
	"strconv"
	"sync"
	"testing/synctest"
	"time"
)

// roundSensors fakes sensors that answer after one second of fake time, and records how
// often each berth was read and how many sensors were being read at the same moment.
type roundSensors struct {
	mu       sync.Mutex
	calls    map[string]int
	busy     int
	mostBusy int
}

func (s *roundSensors) sound(berth string) int {
	s.mu.Lock()
	s.calls[berth]++
	s.busy++
	s.mostBusy = max(s.mostBusy, s.busy)
	s.mu.Unlock()

	time.Sleep(time.Second)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.busy--
	// The depth comes from the berth's number: E1 is 160 cm, E2 is 170 cm and so on.
	n, _ := strconv.Atoi(berth[1:])
	return 150 + 10*n
}

// roundBerths returns the berths E1 to En and the depths roundSensors gives them.
func roundBerths(n int) ([]string, []int) {
	berths := make([]string, n)
	depths := make([]int, n)
	for i := range n {
		berths[i] = "E" + strconv.Itoa(i+1)
		depths[i] = 160 + 10*i
	}
	return berths, depths
}

func Test(t *testing.T) {
	cases := []struct {
		berths, perRound int
		seconds          time.Duration
		mostBusy         int
		what             string
	}{
		{7, 3, 3, 3, "seven berths, three at a time"},
		{3, 1, 3, 1, "three berths, one at a time"},
		{4, 10, 1, 4, "four berths, ten at a time"},
		{6, 2, 3, 2, "six berths, two at a time"},
		{5, 5, 1, 5, "five berths, five at a time"},
	}
	for _, c := range cases {
		synctest.Test(t, func(t *testing.T) {
			s := &roundSensors{calls: map[string]int{}}
			berths, want := roundBerths(c.berths)
			start := time.Now()
			got := soundInRounds(berths, c.perRound, s.sound)
			elapsed := time.Since(start)
			check.Equal(got, want, "the depths in berth order for "+c.what)
			check.Equal(len(s.calls), c.berths, "how many different sensors were read for "+c.what)
			for _, berth := range berths {
				check.Equal(s.calls[berth], 1, "how many times each sensor was read for "+c.what)
			}
			check.Equal(s.mostBusy, c.mostBusy, "the most sensors read at the same moment for "+c.what)
			check.Equal(elapsed, c.seconds*time.Second, "how long the reading takes for "+c.what)
		})
	}

	synctest.Test(t, func(t *testing.T) {
		s := &roundSensors{calls: map[string]int{}}
		check.Equal(soundInRounds(nil, 3, s.sound), []int{}, "the depths of no berths, read in rounds")
		check.Equal(len(s.calls), 0, "how many sensors are read for no berths")
	})
}
