import "strings"

// Sets the room's size, calls main and checks the area and tile lines.
func Test(t *testing.T) {
	quote := func(width, length int) []string {
		widthCm, lengthCm = width, length
		lines := strings.Split(check.PrintedBy(main), "\n")
		check.True(len(lines) > 2, "the quote has at least three lines")
		return lines
	}

	lines := quote(300, 250)
	check.Equal(lines[1], "Floor area: 7.5 square metres", "the area of a room whose sides are whole tiles")
	check.Equal(lines[2], "Tiles: 12 across, 10 along, 120 in all", "the tiles for a room whose sides are whole tiles")

	lines = quote(333, 222)
	check.Equal(lines[1], "Floor area: 7.39 square metres", "the area rounded to two decimal places")
	check.Equal(lines[2], "Tiles: 14 across, 9 along, 126 in all", "the tiles when both sides end in part of a tile")

	lines = quote(26, 24)
	check.Equal(lines[1], "Floor area: 0.06 square metres", "the area of a very small floor")
	check.Equal(lines[2], "Tiles: 2 across, 1 along, 2 in all", "the tiles for a floor just over one tile wide")
}
