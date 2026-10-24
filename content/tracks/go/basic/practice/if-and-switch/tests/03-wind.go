import "strings"

// windLines runs main for a tandem for one hour in one wind and returns its lines.
func windLines(speed int) []string {
	boat, hours, wind = "tandem", 1, speed
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 3, "main prints three lines")
	return lines
}

func Test(t *testing.T) {
	check.Equal(windLines(0)[1], "water: open sea", "no wind at all")
	check.Equal(windLines(19)[1], "water: open sea", "a wind just under the first band's limit")
	check.Equal(windLines(20)[1], "water: sheltered bay only", "a wind exactly at the first band's limit")
	check.Equal(windLines(34)[1], "water: sheltered bay only", "a wind just under the closing limit")
	check.Equal(windLines(34)[2], "to pay: 20", "a hire in the sheltered bay is still paid for")

	lines := windLines(35)
	check.Equal(lines[1], "water: closed", "a wind exactly at the closing limit")
	check.Equal(lines[2], "to pay: nothing, no hire", "the price line when the harbour is closed")
	check.Equal(windLines(80)[1], "water: closed", "a gale")
}
