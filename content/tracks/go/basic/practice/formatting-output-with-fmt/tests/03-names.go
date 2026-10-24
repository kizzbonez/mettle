import "strings"

// nameLine runs main for one cheese and returns the second line of its label.
func nameLine(name string, weight int) string {
	cheese, grams = name, weight
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 2, "the label has at least two lines")
	return lines[1]
}

func Test(t *testing.T) {
	check.Equal(nameLine("Brie", 200), "Brie          200 g", "a short name, left-aligned in 12 characters")
	check.Equal(nameLine("Smoked Gouda", 150), "Smoked Gouda  150 g", "a name of exactly 12 characters")
	check.Equal(nameLine("Époisses", 250), "Époisses      250 g", "an accented name, padded by its characters, not its bytes")
	check.Equal(nameLine("Saint-Nectaire", 400), "Saint-Nectaire  400 g", "a name longer than 12 characters, printed whole")
}
