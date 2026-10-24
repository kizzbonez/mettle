import "strconv"

func Test(t *testing.T) {
	for want := 1; want <= 10; want++ {
		call := strconv.Itoa(want)
		points, ok := scoreArrow(call)
		check.Equal(points, want, "the points of the ring call "+strconv.Quote(call))
		check.True(ok, "the ring call "+strconv.Quote(call)+" is valid")
	}
	points, ok := scoreArrow("M")
	check.Equal(points, 0, `the points of a miss, "M"`)
	check.True(ok, `a miss, "M", is a valid call`)

	for _, call := range []string{"0", "11", "-1", "", "T", "m", "x", "ten"} {
		points, ok := scoreArrow(call)
		check.True(!ok, "the call "+strconv.Quote(call)+" is not valid")
		check.Equal(points, 0, "the points of the call "+strconv.Quote(call)+", which is not valid")
	}
}
