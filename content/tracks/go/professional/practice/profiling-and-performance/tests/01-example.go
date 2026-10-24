import (
	"fmt"
	"slices"
)

// The tests store results in these, so that the compiler cannot remove a call.
var (
	marketText  string
	marketCodes []string
	marketBytes []byte
	marketSum   Summary
)

// marketStalls returns n stalls with codes A0, A1, ...
func marketStalls(n int) []Stall {
	stalls := make([]Stall, n)
	for i := range stalls {
		stalls[i] = Stall{Code: fmt.Sprintf("A%d", i), Name: "Dumpling Cart"}
	}
	return stalls
}

func Test(t *testing.T) {
	stalls := []Stall{{"A1", "Noodle Bar"}, {"A2", "Bao House"}, {"B7", "Churros"}}

	check.Equal(stallList(stalls), "A1 Noodle Bar, A2 Bao House, B7 Churros", "stallList of the three example stalls")
	check.Equal(stallCodes(stalls), []string{"A1", "A2", "B7"}, "stallCodes of the three example stalls")
	takings := []int{1250, 800, 4300, 650}
	check.Equal(summarize(slices.Values(takings)), Summary{Count: 4, Total: 7000, Min: 650, Max: 4300},
		"summarize of the example takings")
	check.Equal(string(appendCents([]byte("total: "), 7000)), "total: 70.00", "appendCents after some text")
	check.Equal(string(appendCents(nil, -5)), "-0.05", "appendCents of a refund of 5 cents")

	big := marketStalls(200)
	check.True(testing.AllocsPerRun(20, func() { marketText = stallList(big) }) <= 1,
		"stallList of 200 stalls stays within its allocation budget")
	check.True(testing.AllocsPerRun(20, func() { marketCodes = stallCodes(big) }) <= 1,
		"stallCodes of 200 stalls stays within its allocation budget")
	passes := 0
	counted := func(yield func(int) bool) {
		passes++
		for _, v := range takings {
			if !yield(v) {
				return
			}
		}
	}
	marketSum = summarize(counted)
	check.Equal(passes, 1, "the number of times summarize reads the takings")
	buf := make([]byte, 0, 32)
	check.True(testing.AllocsPerRun(20, func() { marketBytes = appendCents(buf[:0], 123456) }) == 0,
		"appendCents into a buffer with room stays within its allocation budget")
}
