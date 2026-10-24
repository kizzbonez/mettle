import "strings"

func Test(t *testing.T) {
	board := check.RunScript("")
	lines := strings.Split(board.Out, "\n")
	check.Equal(len(lines)-1, 6, "the number of lines printed")
	check.Equal(lines[0], "Riverside Fair Ferris Wheel", "the first line of the board")
	check.Equal(lines[5], "Rides so far today: 0", "the last line, with the zero value of rides")
	check.Equal(board.Err, "", "nothing printed as an error")
	check.Equal(board.Code, 0, "the exit code of the program")
}
