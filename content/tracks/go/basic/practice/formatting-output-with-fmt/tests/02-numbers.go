import "strings"

// numberLines runs main with the current values and returns its lines.
func numberLines() []string {
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 2, "the label has at least two lines")
	return lines
}

func Test(t *testing.T) {
	labelNo, grams = 7, 1250
	lines := numberLines()
	check.Equal(lines[0], "Label 00007", "a one-digit label number, padded with zeros to five digits")
	check.Equal(lines[1], "Comté        1250 g", "a four-digit weight, right-aligned in five characters")

	labelNo, grams = 123456, 80
	lines = numberLines()
	check.Equal(lines[0], "Label 123456", "a label number longer than five digits, printed whole")
	check.Equal(lines[1], "Comté          80 g", "a two-digit weight, right-aligned in five characters")

	labelNo, grams = 0, 125000
	lines = numberLines()
	check.Equal(lines[0], "Label 00000", "label number 0, padded with zeros to five digits")
	check.Equal(lines[1], "Comté       125000 g", "a weight wider than five characters, printed whole")
}
