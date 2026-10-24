import "strconv"

func Test(t *testing.T) {
	check.Equal(stallList(nil), "", "stallList of no stalls")
	check.Equal(stallList([]Stall{{"C3", "Crêpes"}}), "C3 Crêpes", "stallList of one stall has no separator")
	check.Equal(stallList([]Stall{{"A1", "Pho"}, {"A10", "Satay Grill"}}), "A1 Pho, A10 Satay Grill",
		"stallList of two stalls")

	for _, n := range []int{1, 10, 400} {
		stalls := marketStalls(n)
		want := ""
		for i, s := range stalls {
			if i > 0 {
				want += ", "
			}
			want += s.Code + " " + s.Name
		}
		check.Equal(stallList(stalls), want, "stallList (number of stalls: "+strconv.Itoa(n)+")")
		allocs := testing.AllocsPerRun(10, func() { marketText = stallList(stalls) })
		check.True(allocs <= 1, "stallList allocates at most once (number of stalls: "+strconv.Itoa(n)+")")

		codes := stallCodes(stalls)
		check.Equal(len(codes), n, "the number of codes (number of stalls: "+strconv.Itoa(n)+")")
		check.Equal(codes[n-1], stalls[n-1].Code, "the last code (number of stalls: "+strconv.Itoa(n)+")")
		check.Equal(cap(codes), n, "the capacity of stallCodes' slice, allocated once and exactly (number of stalls: "+strconv.Itoa(n)+")")
		allocs = testing.AllocsPerRun(10, func() { marketCodes = stallCodes(stalls) })
		check.True(allocs <= 1, "stallCodes allocates at most once (number of stalls: "+strconv.Itoa(n)+")")
	}
	check.Equal(len(stallCodes(nil)), 0, "stallCodes of no stalls")
}
