import "strings"

func Test(t *testing.T) {
	lines := strings.Split(check.RunScript("").Out, "\n")
	check.True(len(lines) > 3, "the board has a fourth line")
	check.Equal(lines[1], "Public skating every day from 10 to 18", "the opening hours, second on the board")
	check.Equal(lines[3], "Hours on the ice each day: 8", "the hours on the ice, worked out from the opening hours")
}
