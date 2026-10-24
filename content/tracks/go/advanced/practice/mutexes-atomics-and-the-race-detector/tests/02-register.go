import (
	"slices"
	"strconv"
	"sync"
)

func Test(t *testing.T) {
	const desks, perDesk = 8, 25
	r := newRegister()

	// Eight desks issue 25 wristbands each, all at the same time, while a supervisor keeps
	// asking how many are active.
	issued := make([][]int, desks)
	var wg sync.WaitGroup
	for d := range desks {
		wg.Go(func() {
			for i := range perDesk {
				band := r.Issue("desk" + strconv.Itoa(d) + "-guest" + strconv.Itoa(i))
				issued[d] = append(issued[d], band)
			}
		})
	}
	wg.Go(func() {
		for range 50 {
			_ = r.Active()
		}
	})
	wg.Wait()

	var all []int
	for _, bands := range issued {
		all = append(all, bands...)
	}
	slices.Sort(all)
	want := make([]int, desks*perDesk)
	for i := range want {
		want[i] = i + 1
	}
	check.Equal(all, want, "the wristband numbers issued by eight desks at once, sorted")
	check.Equal(r.Active(), desks*perDesk, "how many wristbands are active after eight desks issued 25 each")
	for d, bands := range issued {
		for i, band := range bands {
			name, ok := r.Holder(band)
			check.True(ok, "every issued wristband is active")
			check.Equal(name, "desk"+strconv.Itoa(d)+"-guest"+strconv.Itoa(i), "the holder of each wristband issued at once")
		}
	}

	// The desks now cancel every wristband, two goroutines per wristband, while others look
	// up holders. Exactly one of the two cancellations of each wristband succeeds.
	succeeded := make([]int, desks*perDesk+1)
	var mu sync.Mutex
	for band := 1; band <= desks*perDesk; band++ {
		for range 2 {
			wg.Go(func() {
				if r.Cancel(band) {
					mu.Lock()
					succeeded[band]++
					mu.Unlock()
				}
				_, _ = r.Holder(band)
			})
		}
	}
	wg.Wait()
	for band := 1; band <= desks*perDesk; band++ {
		check.Equal(succeeded[band], 1, "how many of two cancellations of the same wristband at once succeed")
	}
	check.Equal(r.Active(), 0, "how many wristbands are active after all were cancelled")
	check.True(!r.Cancel(7), "cancelling a wristband that was already cancelled")
	_, ok := r.Holder(desks*perDesk + 1)
	check.True(!ok, "looking up a number that was never issued")
	check.Equal(r.Issue("late arrival"), desks*perDesk+1, "the next number after all the others were cancelled")
}
