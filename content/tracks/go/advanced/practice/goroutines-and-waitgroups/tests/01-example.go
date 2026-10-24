import (
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	// Inside synctest.Test the clock is fake: a one-second Sleep takes no real time.
	synctest.Test(t, func(t *testing.T) {
		depths := map[string]int{"A1": 240, "A2": 185, "B1": 310, "B2": 95}
		sound := func(berth string) int {
			time.Sleep(time.Second)
			return depths[berth]
		}
		berths := []string{"A1", "A2", "B1", "B2"}
		want := []int{240, 185, 310, 95}

		start := time.Now()
		check.Equal(soundAll(berths, sound), want, "soundAll(berths, sound) gives the depths in berth order")
		check.Equal(time.Since(start), time.Second, "how long soundAll takes for four sensors of one second each")

		start = time.Now()
		check.Equal(soundInRounds(berths, 2, sound), want, "soundInRounds(berths, 2, sound) gives the depths in berth order")
		check.Equal(time.Since(start), 2*time.Second, "how long soundInRounds takes for four sensors, two at a time")

		start = time.Now()
		check.Equal(soundInRounds(berths, 3, sound), want, "soundInRounds(berths, 3, sound) gives the depths in berth order")
		check.Equal(time.Since(start), 2*time.Second, "how long soundInRounds takes for four sensors, three at a time")

		start = time.Now()
		check.Equal(soundAll(nil, sound), []int{}, "soundAll(nil, sound) gives no depths")
		check.Equal(time.Since(start), time.Duration(0), "how long soundAll takes for no berths")
	})
}
