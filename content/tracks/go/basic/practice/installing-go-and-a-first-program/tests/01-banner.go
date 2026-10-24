import (
	"strconv"
	"strings"
)

// Runs your program, as `go run .` would, and compares what it printed with
// the banner from the instructions, one line at a time.
func Test(t *testing.T) {
	banner := check.RunScript("")
	want := []string{
		"==============================",
		"  Starfield Planetarium",
		"  Tonight: The Northern Sky",
		"==============================",
		"Doors open at 19:30",
		"Show starts at 20:00",
		"Please switch off your phone",
	}
	got := strings.Split(strings.TrimSuffix(banner.Out, "\n"), "\n")
	for i, line := range want {
		number := strconv.Itoa(i + 1)
		check.True(i < len(got), "line "+number+" of the banner is missing")
		check.Equal(got[i], line, "line "+number+" of the banner")
	}
	check.Equal(len(got), len(want), "the number of lines printed")
	check.Equal(banner.Err, "", "nothing printed as an error")
}
