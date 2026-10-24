func Test(t *testing.T) {
	cases := []struct {
		days, want int
		what       string
	}{
		{-30, 0, "a wetsuit returned a month early"},
		{-1, 0, "a wetsuit returned one day early"},
		{0, 0, "a wetsuit returned on time"},
		{1, 0, "a wetsuit returned on the grace day"},
		{2, 150, "a wetsuit returned on the first charged day"},
		{3, 300, "a wetsuit returned three days late"},
		{8, 1050, "a wetsuit returned on the last day below the cap"},
		{9, 1200, "a wetsuit returned on the day the cap is reached"},
		{10, 1200, "a wetsuit returned the day after the cap is reached"},
		{365, 1200, "a wetsuit returned a year late"},
	}
	for _, c := range cases {
		check.Equal(lateCharge(c.days), c.want, "the charge for "+c.what)
	}
}
