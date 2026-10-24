import "strings"

// Changes today's numbers, then calls main and reads what it printed.
func Test(t *testing.T) {
	closed = 0
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) > 2, "the board has at least three lines")
	check.Equal(lines[1], "Gondolas in service: 18", "the gondolas in service when none is closed")
	check.Equal(lines[2], "Seats today: 72", "the seats today when no gondola is closed")

	closed = 5
	lines = strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) > 2, "the board has at least three lines")
	check.Equal(lines[1], "Gondolas in service: 13", "the gondolas in service with five closed")
	check.Equal(lines[2], "Seats today: 52", "the seats today with five gondolas closed")
}
