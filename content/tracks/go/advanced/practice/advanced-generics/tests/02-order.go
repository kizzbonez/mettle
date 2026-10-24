type testCall struct {
	owner    string
	priority int
}

func Test(t *testing.T) {
	numbers := newWaitingList(func(a, b int) bool { return a < b })
	for _, n := range []int{5, 3, 8, 1, 9, 2, 7} {
		numbers.Add(n)
	}
	check.Equal(numbers.Len(), 7, "Len after seven Adds")
	var got []int
	for numbers.Len() > 0 {
		n, _ := numbers.Next()
		got = append(got, n)
	}
	check.Equal(got, []int{1, 2, 3, 5, 7, 8, 9}, "ints come out smallest first with before = a < b")
	zero, ok := numbers.Next()
	check.True(!ok && zero == 0, "Next on an emptied list returns 0 and false")
	zero, ok = numbers.Peek()
	check.True(!ok && zero == 0, "Peek on an emptied list returns 0 and false")

	// Many calls with equal priorities: among equals, the earlier call goes first.
	calls := newWaitingList(func(a, b testCall) bool { return a.priority > b.priority })
	owners := []testCall{
		{"Ada", 1}, {"Bo", 2}, {"Cy", 1}, {"Di", 2}, {"Ed", 1}, {"Flo", 3}, {"Gus", 1},
		{"Hal", 2}, {"Ivy", 1}, {"Jo", 3}, {"Kit", 1}, {"Lu", 2}, {"Mo", 1}, {"Ned", 1},
	}
	for _, c := range owners {
		calls.Add(c)
	}
	var order []string
	for calls.Len() > 0 {
		c, _ := calls.Next()
		order = append(order, c.owner)
	}
	want := []string{"Flo", "Jo", "Bo", "Di", "Hal", "Lu", "Ada", "Cy", "Ed", "Gus", "Ivy", "Kit", "Mo", "Ned"}
	check.Equal(order, want, "fourteen calls in three priorities: highest first, and in arrival order among equals")

	// Arrival order counts every Add, also after items have been taken off.
	mixed := newWaitingList(func(a, b testCall) bool { return a.priority > b.priority })
	mixed.Add(testCall{"Ada", 1})
	mixed.Add(testCall{"Bo", 2})
	first, _ := mixed.Next()
	mixed.Add(testCall{"Cy", 1})
	mixed.Add(testCall{"Di", 2})
	mixed.Add(testCall{"Ed", 1})
	peeked, _ := mixed.Peek()
	check.Equal(peeked.owner, "Di", "Peek after adding and removing")
	peeked, _ = mixed.Peek()
	check.Equal(peeked.owner, "Di", "a second Peek returns the same item: Peek removes nothing")
	check.Equal(mixed.Len(), 4, "Len after five Adds and one Next")
	order = []string{first.owner}
	for mixed.Len() > 0 {
		c, _ := mixed.Next()
		order = append(order, c.owner)
	}
	check.Equal(order, []string{"Bo", "Di", "Ada", "Cy", "Ed"}, "adds and removes mixed: priority first, then arrival")
}
