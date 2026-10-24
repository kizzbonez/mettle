func Test(t *testing.T) {
	washes := []Wash{
		{Number: 7, Programme: "rinse", Price: 600},
		{Number: 8, Programme: "deluxe", Price: 1400},
		{Number: 9, Programme: "wax", Price: 1400},
		{Number: 10, Programme: "foam", Price: 450},
	}
	byPrice := func(w Wash) Cents { return w.Price }
	best, ok := MaxBy(washes, byPrice)
	check.True(ok, "MaxBy of four washes reports a value")
	check.Equal(best.Number, 8, "the first of two washes that share the highest price")

	best, _ = MaxBy(washes, func(w Wash) string { return w.Programme })
	check.Equal(best.Programme, "wax", "MaxBy with a string key")

	best, _ = MaxBy(washes, func(w Wash) int { return -w.Number })
	check.Equal(best.Number, 7, "MaxBy with a key that reverses the order")

	best, _ = MaxBy(washes[3:], byPrice)
	check.Equal(best.Number, 10, "MaxBy of a single wash")

	none, ok := MaxBy([]Wash{}, byPrice)
	check.True(!ok, "MaxBy of no washes reports false")
	check.Equal(none, Wash{}, "MaxBy of no washes returns the zero Wash")

	word, ok := MaxBy([]string{"sponge", "mop", "bucket"}, func(s string) int { return len(s) })
	check.True(ok, "MaxBy of three words reports a value")
	check.Equal(word, "sponge", "the first of two longest words, found with an int key")
	n, ok := MaxBy([]float64{}, func(f float64) float64 { return f })
	check.True(!ok && n == 0, "MaxBy of no floats returns 0 and false")
}
