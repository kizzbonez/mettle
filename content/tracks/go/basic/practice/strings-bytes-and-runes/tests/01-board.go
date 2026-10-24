import (
	"strconv"
	"strings"
)

// Runs your program, as `go run .` would, and compares what it printed with
// the board from the instructions, one line at a time.
func Test(t *testing.T) {
	board := check.RunScript("")
	if board.Code != 0 {
		check.Fail("the program stopped with exit code "+strconv.Itoa(board.Code)+" before the board was finished", board.Err)
	}
	want := []string{
		"CRÊPE SUZETTE",
		"=============",
		"With: orange, butter, sugar",
		"Price: 7.50 euros",
		"Dish of the day: true",
	}
	got := strings.Split(strings.TrimSuffix(board.Out, "\n"), "\n")
	for i, line := range want {
		number := strconv.Itoa(i + 1)
		check.True(i < len(got), "line "+number+" of the board is missing")
		check.Equal(got[i], line, "line "+number+" of the board")
	}
	check.Equal(len(got), len(want), "the number of lines printed")
	check.Equal(board.Err, "", "nothing printed as an error")
}
