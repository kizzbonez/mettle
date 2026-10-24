func Test(t *testing.T) {
	cases := []struct {
		cents int
		text  string
	}{
		{0, "0.00"},
		{5, "0.05"},
		{70, "0.70"},
		{1250, "12.50"},
		{100000, "1000.00"},
		{123456789, "1234567.89"},
		{-5, "-0.05"},
		{-99, "-0.99"},
		{-1250, "-12.50"},
		{-100, "-1.00"},
	}
	for _, c := range cases {
		check.Equal(string(appendCents(nil, c.cents)), c.text, "appendCents to an empty slice")
	}

	line := appendCents([]byte("A1;"), 980)
	line = append(line, ';')
	line = appendCents(line, -30)
	check.Equal(string(line), "A1;9.80;-0.30", "appendCents keeps what dst already holds")

	buf := make([]byte, 0, 64)
	for _, c := range cases {
		allocs := testing.AllocsPerRun(20, func() { marketBytes = appendCents(buf[:0], c.cents) })
		check.True(allocs == 0, "appendCents allocates nothing when dst has room")
	}
	out := appendCents(buf[:0], 4321)
	check.True(cap(out) == 64 && &out[0] == &buf[:1][0], "appendCents writes into dst's own array when it has room")
}
