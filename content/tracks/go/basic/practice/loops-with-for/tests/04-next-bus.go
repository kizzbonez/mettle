import "strings"

// nextLine runs main for the passenger's time on a fixed timetable and returns line 3.
func nextLine(arrival int) string {
	first, every, last, lunch = 9*60, 40, 14*60, 12
	now = arrival
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 3, "main prints three lines")
	return lines[2]
}

func Test(t *testing.T) {
	check.Equal(nextLine(8*60+5), "next after 08:05: 09:00", "a passenger who arrives before the first bus")
	check.Equal(nextLine(9*60+40), "next after 09:40: 09:40", "a passenger who arrives just as a bus leaves")
	check.Equal(nextLine(9*60+41), "next after 09:41: 10:20", "a passenger who just missed a bus")
	check.Equal(nextLine(11*60+45), "next after 11:45: 13:00", "a passenger waiting through the lunch hour")
	check.Equal(nextLine(13*60+41), "next after 13:41: none", "a passenger who arrives after the last bus")
}
