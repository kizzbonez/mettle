import "strings"

func Test(t *testing.T) {
	out := check.RunScript("").Out
	check.True(strings.Contains(out, "Doors open at 19:30\n"), "a line with the time the doors open")
	check.True(strings.Contains(out, "Show starts at 20:00\n"), "a line with the time the show starts, with one space before the time")
	check.True(!strings.Contains(out, "%"), "no formatting directive such as %s printed as it is")
	lines := strings.Split(out, "\n")
	check.True(len(lines) > 5, "the banner has at least six lines")
	check.Equal(lines[4], "Doors open at 19:30", "the fifth line, when the doors open")
	check.Equal(lines[5], "Show starts at 20:00", "the sixth line, when the show starts")
}
