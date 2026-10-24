import (
	"strconv"
	"strings"
)

// Runs your program, as `go run .` would, and compares what it printed with
// the quote from the instructions, one line at a time.
func Test(t *testing.T) {
	quote := check.RunScript("")
	if quote.Code != 0 {
		check.Fail("the program stopped with exit code "+strconv.Itoa(quote.Code)+" before the quote was finished", quote.Err)
	}
	want := []string{
		"Quote Q-340x275",
		"Floor area: 9.35 square metres",
		"Tiles: 14 across, 11 along, 154 in all",
		"Boxes: 13 with 2 tiles spare",
		"Price: 409.50 euros",
	}
	got := strings.Split(strings.TrimSuffix(quote.Out, "\n"), "\n")
	for i, line := range want {
		number := strconv.Itoa(i + 1)
		check.True(i < len(got), "line "+number+" of the quote is missing")
		check.Equal(got[i], line, "line "+number+" of the quote")
	}
	check.Equal(len(got), len(want), "the number of lines printed")
	check.Equal(quote.Err, "", "nothing printed as an error")
}
