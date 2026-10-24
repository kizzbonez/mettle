import "strings"

// departureLines runs main for one timetable and returns its three lines.
func departureLines(from, gap, until int) []string {
	first, every, last, lunch, now = from, gap, until, 12, 0
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 3, "main prints three lines")
	check.True(!strings.HasSuffix(lines[0], " "), "the line of departures has no space at its end")
	return lines
}

func Test(t *testing.T) {
	lines := departureLines(5*60+50, 30, 7*60+50)
	check.Equal(lines[0], "05:50 06:20 06:50 07:20 07:50", "early buses, with a bus exactly at the last time")
	check.Equal(lines[1], "buses: 5", "the count of the early buses")

	lines = departureLines(8*60, 45, 10*60)
	check.Equal(lines[0], "08:00 08:45 09:30", "buses that stop before the last time")
	check.Equal(lines[1], "buses: 3", "the count when the last time is not a departure")

	lines = departureLines(17*60+5, 60, 17*60+5)
	check.Equal(lines[0], "17:05", "a day with one bus, leaving at the first and last time")
	check.Equal(lines[1], "buses: 1", "the count for a day with one bus")

	lines = departureLines(18*60, 20, 17*60)
	check.Equal(lines[0], "no buses", "a first bus later than the last time")
	check.Equal(lines[1], "buses: 0", "the count when no bus runs")
}
