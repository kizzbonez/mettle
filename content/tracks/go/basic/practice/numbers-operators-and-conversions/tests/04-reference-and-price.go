import "strings"

// Sets the room's size, calls main and checks the reference and the price.
func Test(t *testing.T) {
	quoteLines := func(width, length int) []string {
		widthCm, lengthCm = width, length
		lines := strings.Split(check.PrintedBy(main), "\n")
		check.True(len(lines) > 4, "the quote has at least five lines")
		return lines
	}

	lines := quoteLines(300, 250)
	check.Equal(lines[0], "Quote Q-300x250", "the reference, built from the width and the length")
	check.Equal(lines[4], "Price: 315.00 euros", "a whole number of euros, written with two decimals")

	lines = quoteLines(333, 222)
	check.Equal(lines[0], "Quote Q-333x222", "the reference for another room")
	check.Equal(lines[4], "Price: 346.50 euros", "a price with half a euro, written with two decimals")

	lines = quoteLines(26, 24)
	check.Equal(lines[4], "Price: 31.50 euros", "the price of a single box")
}
