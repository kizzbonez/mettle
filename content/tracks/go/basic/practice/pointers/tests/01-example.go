func Test(t *testing.T) {
	team := []Bowler{{Name: "Ada"}, {Name: "Bo", Games: []int{150, 170}}}
	ada := findBowler(team, "ADA")
	check.True(ada == &team[0], `findBowler(team, "ADA") points at team[0]`)
	check.Equal(addGame(ada, 140), true, "addGame(ada, 140)")
	check.Equal(team[0].Games, []int{140}, "team[0].Games after addGame(ada, 140)")
	check.Equal(addGame(ada, 301), false, "addGame(ada, 301)")
	check.Equal(team[0].Games, []int{140}, "team[0].Games after addGame(ada, 301)")
	setHandicap(ada)
	check.Equal(handicapOf(&team[0]), 54, "handicapOf(&team[0]) after setHandicap(ada)")
	check.Equal(handicapOf(&team[1]), 0, "handicapOf(&team[1]) for Bo, who has no handicap yet")
	check.Equal(handicapOf(findBowler(team, "Cy")), 0, `handicapOf(findBowler(team, "Cy"))`)
}
