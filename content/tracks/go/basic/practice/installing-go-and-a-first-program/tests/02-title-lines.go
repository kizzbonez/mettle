import "strings"

func Test(t *testing.T) {
	lines := strings.Split(check.RunScript("").Out, "\n")
	check.True(len(lines) > 3, "the banner has at least four lines")
	check.Equal(lines[1], "  Starfield Planetarium", "the planetarium's name, on the second line with two spaces in front")
	check.Equal(lines[2], "  Tonight: The Northern Sky", "tonight's show, on the third line with two spaces in front")
}
