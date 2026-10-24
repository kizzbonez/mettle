import "strings"

// lunchLines runs main for one timetable and lunch hour and returns its three lines.
func lunchLines(from, gap, until, hour int) []string {
	first, every, last, lunch, now = from, gap, until, hour, 0
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 3, "main prints three lines")
	return lines
}

func Test(t *testing.T) {
	lines := lunchLines(11*60+40, 10, 13*60, 12)
	check.Equal(lines[0], "11:40 11:50 13:00", "the buses around a lunch hour from 12:00 to 12:59")
	check.Equal(lines[1], "buses: 3", "the lunch-hour buses are not counted")

	lines = lunchLines(12*60+30, 30, 14*60, 13)
	check.Equal(lines[0], "12:30 14:00", "a lunch hour at 13, which keeps the 12:30 bus")

	lines = lunchLines(12*60, 15, 12*60+59, 12)
	check.Equal(lines[0], "no buses", "a timetable that lies entirely in the lunch hour")
	check.Equal(lines[1], "buses: 0", "the count for a timetable entirely in the lunch hour")
	check.Equal(lines[2], "next after 00:00: none", "the next bus when every bus falls in the lunch hour")
}
