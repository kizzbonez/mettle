func Test(t *testing.T) {
	ivy := Bowler{Name: "Ivy", Games: []int{150, 151, 152}}
	setHandicap(&ivy)
	check.True(ivy.Handicap != nil, "setHandicap gives a bowler with games a handicap")
	check.Equal(handicapOf(&ivy), 44, "the handicap uses the integer average of the games")

	jo := Bowler{Name: "Jo", Games: []int{230, 210}}
	setHandicap(&jo)
	check.True(jo.Handicap != nil, "a bowler averaging over 200 still gets a handicap")
	check.Equal(*jo.Handicap, 0, "a handicap never goes below 0")

	kai := Bowler{Name: "Kai"}
	setHandicap(&kai)
	check.True(kai.Handicap == nil, "a bowler with no games keeps a nil handicap")
	check.Equal(handicapOf(&kai), 0, "handicapOf a bowler with no handicap")

	lu := Bowler{Name: "Lu", Games: []int{100}}
	setHandicap(&lu)
	check.Equal(handicapOf(&lu), 90, "the handicap of a bowler with one game of 100")
	lu.Games = append(lu.Games, 200)
	setHandicap(&lu)
	check.Equal(handicapOf(&lu), 45, "setHandicap again after another game")
	check.Equal(handicapOf(&ivy), 44, "each bowler keeps their own handicap")

	check.Equal(handicapOf(nil), 0, "handicapOf a nil bowler")
}
