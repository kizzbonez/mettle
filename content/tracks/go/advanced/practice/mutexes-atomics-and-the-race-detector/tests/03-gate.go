import "sync"

func Test(t *testing.T) {
	var g Gate
	check.Equal(g.Total(), int64(0), "the total of a new Gate")

	// Ten gates scan 200 wristbands each, all at once, while the control room reads the total.
	var wg sync.WaitGroup
	for range 10 {
		wg.Go(func() {
			for range 200 {
				g.Scan()
			}
		})
	}
	readings := make([]int64, 0, 20)
	wg.Go(func() {
		for range 20 {
			readings = append(readings, g.Total())
		}
	})
	wg.Wait()

	check.Equal(g.Total(), int64(2000), "the total after ten gates scanned 200 wristbands each at once")
	for i := 1; i < len(readings); i++ {
		check.True(readings[i] >= readings[i-1], "the total never goes down while gates are scanning")
	}

	other := &Gate{}
	other.Scan()
	check.Equal(other.Total(), int64(1), "a second Gate keeps its own count")
	check.Equal(g.Total(), int64(2000), "the first Gate is not changed by scans at the second")
}
