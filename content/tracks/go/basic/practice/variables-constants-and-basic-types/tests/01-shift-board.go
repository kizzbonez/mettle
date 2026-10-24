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
		"Riverside Fair Ferris Wheel",
		"Gondolas in service: 15",
		"Seats today: 60",
		"Morning: Mo at the controls, Ade at the gate",
		"Afternoon: Ade at the controls, Mo at the gate",
		"Rides so far today: 0",
	}
	got := strings.Split(strings.TrimSuffix(board.Out, "\n"), "\n")
	for i, line := range want {
		number := strconv.Itoa(i + 1)
		check.True(i < len(got), "line "+number+" of the board is missing")
		check.Equal(got[i], line, "line "+number+" of the board")
	}
	check.Equal(len(got), len(want), "the number of lines printed")
}
