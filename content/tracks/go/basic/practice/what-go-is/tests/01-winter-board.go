import (
	"strconv"
	"strings"
)

// Runs your program, as `go run .` would, and compares what it printed with
// the winter board from the instructions, one line at a time.
func Test(t *testing.T) {
	board := check.RunScript("")
	want := []string{
		"Welcome to Northgate Ice Rink",
		"Public skating every day from 10 to 18",
		"Skate hire: 4 euros",
		"Hours on the ice each day: 8",
		"Gloves are required on the ice",
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
