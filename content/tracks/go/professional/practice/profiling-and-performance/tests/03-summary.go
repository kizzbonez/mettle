import "iter"

// countedTakings returns the values as a sequence, and a pointer to the number
// of times the sequence has been started.
func countedTakings(values ...int) (iter.Seq[int], *int) {
	passes := new(0)
	seq := func(yield func(int) bool) {
		*passes++
		for _, v := range values {
			if !yield(v) {
				return
			}
		}
	}
	return seq, passes
}

func Test(t *testing.T) {
	seq, passes := countedTakings(900, 2400, 1500)
	check.Equal(summarize(seq), Summary{Count: 3, Total: 4800, Min: 900, Max: 2400}, "summarize of three takings")
	check.Equal(*passes, 1, "the number of times summarize reads three takings")

	seq, passes = countedTakings(-350, 1200, -800, 400)
	check.Equal(summarize(seq), Summary{Count: 4, Total: 450, Min: -800, Max: 1200},
		"summarize of takings that include refunds (negative values)")
	check.Equal(*passes, 1, "the number of times summarize reads takings with refunds")

	seq, passes = countedTakings(-200, -50)
	check.Equal(summarize(seq), Summary{Count: 2, Total: -250, Min: -200, Max: -50},
		"summarize of a night with only refunds")
	check.Equal(*passes, 1, "the number of times summarize reads a night with only refunds")

	seq, _ = countedTakings(725)
	check.Equal(summarize(seq), Summary{Count: 1, Total: 725, Min: 725, Max: 725}, "summarize of a single taking")

	seq, passes = countedTakings()
	check.Equal(summarize(seq), Summary{}, "summarize of a night with no takings")
	check.True(*passes <= 1, "summarize reads an empty night at most once")

	many := make([]int, 5000)
	want := Summary{Count: len(many), Min: 1 << 30, Max: -1 << 30}
	for i := range many {
		many[i] = (i*7919)%10007 - 2000
		want.Total += many[i]
		want.Min = min(want.Min, many[i])
		want.Max = max(want.Max, many[i])
	}
	seq, passes = countedTakings(many...)
	got := summarize(seq)
	check.Equal(got, want, "summarize of 5000 takings")
	check.Equal(*passes, 1, "the number of times summarize reads 5000 takings")
}
