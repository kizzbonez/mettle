import "strings"

func Test(t *testing.T) {
	board := check.RunScript("")
	lines := strings.Split(board.Out, "\n")
	check.Equal(len(lines)-1, 5, "the number of lines printed")
	check.Equal(lines[0], "Welcome to Northgate Ice Rink", "the first line of the board")
	check.Equal(lines[4], "Gloves are required on the ice", "the last line of the board")
	check.Equal(board.Err, "", "nothing printed as an error")
	check.Equal(board.Code, 0, "the exit code of the program")
}
