import "strings"

// Sets the room's size, calls main and checks the boxes line.
func Test(t *testing.T) {
	boxesLine := func(width, length int) string {
		widthCm, lengthCm = width, length
		lines := strings.Split(check.PrintedBy(main), "\n")
		check.True(len(lines) > 3, "the quote has at least four lines")
		return lines[3]
	}

	check.Equal(boxesLine(300, 250), "Boxes: 10 with 0 tiles spare", "the boxes when the tiles fill whole boxes exactly")
	check.Equal(boxesLine(333, 222), "Boxes: 11 with 6 tiles spare", "the boxes rounded up, and the spare tiles")
	check.Equal(boxesLine(26, 24), "Boxes: 1 with 10 tiles spare", "the boxes for fewer tiles than one box holds")
	check.Equal(boxesLine(600, 50), "Boxes: 4 with 0 tiles spare", "the boxes for a long, narrow floor")
}
