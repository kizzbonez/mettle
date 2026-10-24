func Test(t *testing.T) {
	team := []Bowler{{Name: "Eli"}, {Name: "Fay", Games: []int{120}}, {Name: "Gus"}}
	fay := findBowler(team, "fay")
	check.True(fay != nil, "findBowler finds a bowler whose name differs only in case")
	check.True(fay == &team[1], "findBowler returns a pointer to the element in the slice")

	fay.Games = append(fay.Games, 135)
	check.Equal(team[1].Games, []int{120, 135}, "a change made through the pointer reaches the team")
	addGame(findBowler(team, "GUS"), 99)
	check.Equal(team[2].Games, []int{99}, "addGame through findBowler changes the team member")
	check.Equal(len(team[0].Games), 0, "the other bowlers are unchanged")

	check.True(findBowler(team, "Hal") == nil, "findBowler returns nil for a name not in the team")
	check.True(findBowler(team, "Ga") == nil, "findBowler does not match the start of a name")
	check.True(findBowler(nil, "Eli") == nil, "findBowler returns nil for an empty team")
}
