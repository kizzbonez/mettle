type testVisit struct {
	pet, species string
	urgency      int
	insured      bool
}

func Test(t *testing.T) {
	visits := []testVisit{
		{"Biscuit", "dog", 1, true}, {"Pepper", "cat", 3, false}, {"Mochi", "rabbit", 1, true},
		{"Rolo", "dog", 2, true}, {"Tig", "cat", 1, false}, {"Nemo", "fish", 2, false},
	}
	newList := func() *waitingList[testVisit] {
		list := newWaitingList(func(a, b testVisit) bool { return a.urgency > b.urgency })
		for _, v := range visits {
			list.Add(v)
		}
		return list
	}

	counted := newList()
	empty := newWaitingList(func(a, b testVisit) bool { return a.urgency > b.urgency })
	check.Equal(len(empty.Count(func(v testVisit) string { return v.species })), 0, "Count on an empty list")

	check.Equal(counted.Count(func(v testVisit) string { return v.species }),
		map[string]int{"dog": 2, "cat": 2, "rabbit": 1, "fish": 1}, "Count with a string key: species")
	check.Equal(counted.Count(func(v testVisit) int { return v.urgency }),
		map[int]int{1: 3, 2: 2, 3: 1}, "Count with an int key: urgency")
	check.Equal(counted.Count(func(v testVisit) bool { return v.insured }),
		map[bool]int{true: 3, false: 3}, "Count with a bool key: insured")
	check.Equal(counted.Len(), len(visits), "Len after three Counts: Count removes nothing")

	untouched := newList()
	for untouched.Len() > 0 {
		want, _ := untouched.Next()
		got, ok := counted.Next()
		check.True(ok, "the counted list still holds every visit")
		check.Equal(got, want, "after Count, the list gives the same visits in the same order as one never counted")
	}

	partly := newList()
	partly.Next() // Pepper, the only urgency 3
	partly.Next() // Rolo, the first urgency 2
	check.Equal(partly.Count(func(v testVisit) string { return v.species }),
		map[string]int{"dog": 1, "cat": 1, "rabbit": 1, "fish": 1}, "Count counts only the visits still waiting")
}
