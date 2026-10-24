type testPet struct {
	name, species string
	urgency       int
}

func (p testPet) MoreUrgent(q testPet) bool { return p.urgency > q.urgency }

func Test(t *testing.T) {
	room := byUrgency[testPet]()
	room.Add(testPet{"Biscuit", "dog", 1})
	room.Add(testPet{"Pepper", "cat", 3})
	room.Add(testPet{"Mochi", "rabbit", 1})
	room.Add(testPet{"Rolo", "dog", 2})

	species := room.Count(func(p testPet) string { return p.species })
	check.Equal(species, map[string]int{"cat": 1, "dog": 2, "rabbit": 1}, "room.Count by species")
	first, ok := room.Peek()
	check.Equal(first, testPet{"Pepper", "cat", 3}, "room.Peek() returns the most urgent pet")
	check.True(ok, "room.Peek() on a list that is not empty returns true")
	check.Equal(room.Len(), 4, "room.Len() after four Adds, a Count and a Peek")

	var order []string
	for range 4 {
		p, ok := room.Next()
		check.True(ok, "room.Next() returns true while pets are waiting")
		order = append(order, p.name)
	}
	check.Equal(order, []string{"Pepper", "Rolo", "Biscuit", "Mochi"}, "the order of room.Next(): most urgent first, then whoever came first")
	none, ok := room.Next()
	check.True(!ok, "room.Next() on an empty list returns false")
	check.Equal(none, testPet{}, "room.Next() on an empty list returns the zero value")

	calls := newWaitingList(func(a, b string) bool { return len(a) < len(b) })
	calls.Add("Mrs Okafor")
	calls.Add("Lee")
	who, _ := calls.Next()
	check.Equal(who, "Lee", "newWaitingList with shorter names first: calls.Next()")
}
