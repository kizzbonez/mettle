import (
	"fmt"
	"sync"
)

func Test(t *testing.T) {
	b := NewBookings()

	// Eight members book eight different evenings at the same moment. With a
	// copied mutex, nothing protects the map, and the race detector fails the test.
	var wg sync.WaitGroup
	errs := make([]error, 8)
	for i := range 8 {
		wg.Go(func() {
			errs[i] = b.Book(fmt.Sprintf("2026-12-%02d 19:00", i+1), fmt.Sprintf("member%d", i))
		})
	}
	wg.Wait()
	for i, err := range errs {
		check.NoError(err, "a booking made at the same moment as seven others")
		check.True(b.IsBooked(fmt.Sprintf("2026-12-%02d 19:00", i+1)), "every one of eight simultaneous bookings is kept")
	}

	// Eight members try for the same evening at once: exactly one gets it.
	wins := make([]bool, 8)
	for i := range 8 {
		wg.Go(func() {
			wins[i] = b.Book("2026-12-24 20:00", fmt.Sprintf("hopeful%d", i)) == nil
		})
	}
	wg.Wait()
	won := 0
	for _, w := range wins {
		if w {
			won++
		}
	}
	check.Equal(won, 1, "the number of members who get one evening that eight asked for at once")

	check.NoError(b.Book("2026-12-31 22:00", "\tcy\n"), "booking with a tab and a newline around the name")
	check.Equal(b.Member("2026-12-31 22:00"), "cy", "the member's name is stored without surrounding spaces")
	check.True(b.Taken("2026-12-31 22:00") && !b.Taken("2026-12-30 22:00"), "Taken still answers like IsBooked")
}
