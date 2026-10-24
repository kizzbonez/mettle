import "strings"

// hourLines runs main for a boat hired for some hours on a calm day.
func hourLines(name string, length int) []string {
	boat, hours, wind = name, length, 5
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 3, "main prints three lines")
	return lines
}

func Test(t *testing.T) {
	check.Equal(hourLines("solo", 1)[2], "to pay: 12", "one hour")
	check.Equal(hourLines("solo", 4)[2], "to pay: 48", "exactly four hours")
	check.Equal(hourLines("solo", 5)[2], "to pay: 48", "five hours cost the same as four")
	check.Equal(hourLines("canoe", 8)[2], "to pay: 100", "a whole day in a canoe")
	check.Equal(hourLines("tandem", 2)[2], "to pay: 40", "two hours in a tandem")
}
