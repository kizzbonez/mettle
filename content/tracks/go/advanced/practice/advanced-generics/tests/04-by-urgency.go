// testTicket: a higher severity is more urgent.
type testTicket struct {
	id       string
	severity int
}

func (a testTicket) MoreUrgent(b testTicket) bool { return a.severity > b.severity }

// testRecall: an earlier due day is more urgent, so the smaller number goes first.
type testRecall struct {
	pet    string
	dueDay int
}

func (a testRecall) MoreUrgent(b testRecall) bool { return a.dueDay < b.dueDay }

func Test(t *testing.T) {
	tickets := byUrgency[testTicket]()
	check.Equal(tickets.Len(), 0, "byUrgency returns an empty list")
	_, ok := tickets.Next()
	check.True(!ok, "Next on a new byUrgency list returns false")
	for _, tk := range []testTicket{{"T1", 2}, {"T2", 5}, {"T3", 2}, {"T4", 9}, {"T5", 5}, {"T6", 2}} {
		tickets.Add(tk)
	}
	var ids []string
	for tickets.Len() > 0 {
		tk, _ := tickets.Next()
		ids = append(ids, tk.id)
	}
	check.Equal(ids, []string{"T4", "T2", "T5", "T1", "T3", "T6"}, "tickets by severity, most severe first, ties in arrival order")

	recalls := byUrgency[testRecall]()
	for _, r := range []testRecall{{"Biscuit", 30}, {"Pepper", 4}, {"Mochi", 12}, {"Rolo", 4}} {
		recalls.Add(r)
	}
	var pets []string
	for recalls.Len() > 0 {
		r, _ := recalls.Next()
		pets = append(pets, r.pet)
	}
	check.Equal(pets, []string{"Pepper", "Rolo", "Mochi", "Biscuit"}, "recalls ordered by their own MoreUrgent method, earliest day first")
}
