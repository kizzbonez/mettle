func Test(t *testing.T) {
	washes := []Wash{
		{Number: 1, Programme: "basic", Price: 850},
		{Number: 2, Programme: "deluxe", Price: 1400},
		{Number: 3, Programme: "basic", Price: 850},
	}
	var line Queue[Wash]
	for _, w := range washes {
		line.Push(w)
	}
	check.Equal(line.Map(func(w Wash) string { return w.Programme }), []string{"basic", "deluxe", "basic"}, "the programmes in the queue, from Map")
	check.Equal(line.Len(), 3, "Len after three pushes")
	first, ok := line.Pop()
	check.True(ok, "Pop on a queue of three reports a value")
	check.Equal(first.Number, 1, "the ticket number that Pop returns first")
	check.Equal(line.Len(), 2, "Len after one Pop")

	check.Equal(Total([]Cents{850, 1400, 850}), Cents(3100), "Total of three prices in Cents")
	check.Equal(Tally([]string{"basic", "deluxe", "basic"}), map[string]int{"basic": 2, "deluxe": 1}, "Tally of three programmes")
	best, ok := MaxBy(washes, func(w Wash) Cents { return w.Price })
	check.True(ok, "MaxBy of three washes reports a value")
	check.Equal(best.Number, 2, "the wash MaxBy picks by price")

	var empty Queue[int]
	v, ok := empty.Pop()
	check.Equal(v, 0, "the value Pop returns from an empty Queue[int]")
	check.True(!ok, "Pop on an empty queue reports false")
}
