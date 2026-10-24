import "strings"

func Test(t *testing.T) {
	lines := strings.Split(check.RunScript("").Out, "\n")
	check.True(len(lines) > 2, "the board has a third line")
	check.Equal(lines[2], "Skate hire: 4 euros", "the skate hire line, third on the board")
}
