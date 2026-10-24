func Test(t *testing.T) {
	b := Bowler{Name: "Dee"}
	check.True(addGame(&b, 0), "addGame accepts a score of 0")
	check.True(addGame(&b, 300), "addGame accepts a perfect game of 300")
	check.True(addGame(&b, 187), "addGame accepts a score of 187")
	check.Equal(b.Games, []int{0, 300, 187}, "the games of the bowler passed in, in the order played")

	check.Equal(addGame(&b, -1), false, "addGame refuses a score below 0")
	check.Equal(addGame(&b, 301), false, "addGame refuses a score above 300")
	check.Equal(b.Games, []int{0, 300, 187}, "refused scores leave the games unchanged")
	check.True(b.Handicap == nil, "addGame does not set a handicap")
	check.Equal(b.Name, "Dee", "addGame does not change the name")
}
