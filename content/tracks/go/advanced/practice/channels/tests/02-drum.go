import "testing/synctest"

// drumIsClosed reports whether a receive from drum would find it closed, without blocking.
func drumIsClosed(drum <-chan int) bool {
	select {
	case _, ok := <-drum:
		return !ok
	default:
		return false
	}
}

func Test(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		balls := []int{33, 5, 61, 18, 47}
		drum := loadDrum(balls)
		synctest.Wait()
		check.Equal(cap(drum), 5, "the capacity of the drum loaded with five balls")
		check.Equal(len(drum), 5, "how many balls wait in the drum after loading five")
		for _, want := range balls {
			got, ok := <-drum
			check.True(ok, "a ball comes out while the drum still holds balls")
			check.Equal(got, want, "the balls come out of the drum in the order they were loaded")
		}
		check.True(drumIsClosed(drum), "the drum is closed after the last ball")

		one := loadDrum([]int{75})
		synctest.Wait()
		check.Equal(cap(one), 1, "the capacity of the drum loaded with one ball")
		check.Equal(<-one, 75, "the ball that comes out of a drum of one")
		check.True(drumIsClosed(one), "a drum of one ball is closed after that ball")

		empty := loadDrum(nil)
		synctest.Wait()
		check.Equal(cap(empty), 0, "the capacity of the drum loaded with no balls")
		check.True(drumIsClosed(empty), "the drum loaded with no balls is closed")
	})
}
