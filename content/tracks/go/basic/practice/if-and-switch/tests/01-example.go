import "strings"

func Test(t *testing.T) {
	ran := check.RunScript("")
	lines := strings.Split(strings.TrimSuffix(ran.Out, "\n"), "\n")
	check.Equal(len(lines), 3, "the number of lines printed")
	check.Equal(lines[0], "boat: tandem, 20 an hour", "line 1, the boat and its rate")
	check.Equal(lines[1], "water: open sea", "line 2, the water for a wind of 18 km/h")
	check.Equal(lines[2], "to pay: 60", "line 3, the price of three hours")
}
