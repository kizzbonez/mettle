func Test(t *testing.T) {
	morning := newRoundTally(3)
	evening := newRoundTally(3)
	total, done := morning(20)
	check.Equal(total, 20, "the first end of the morning round")
	check.True(!done, "the morning round is not done after one of three ends")
	total, _ = evening(5)
	check.Equal(total, 5, "the evening round keeps its own total")
	total, _ = morning(25)
	check.Equal(total, 45, "the second end of the morning round")
	total, done = morning(30)
	check.Equal(total, 75, "the last end of the morning round")
	check.True(done, "the morning round is done after three ends")

	total, done = morning(28)
	check.Equal(total, 75, "an extra end after the round is done changes nothing")
	check.True(done, "the round stays done after an extra end")

	total, done = evening(7)
	check.Equal(total, 12, "the evening round, untouched by the morning's ends")
	check.True(!done, "the evening round is not done after two of three ends")

	single := newRoundTally(1)
	total, done = single(9)
	check.Equal(total, 9, "a round of one end")
	check.True(done, "a round of one end is done at once")
}
