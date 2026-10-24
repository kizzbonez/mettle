import "strings"

// Puts other entries into the package-level variable and checks the last line.
func Test(t *testing.T) {
	specialFor := func(typed string) string {
		entry = typed
		lines := strings.Split(check.PrintedBy(main), "\n")
		check.True(len(lines) > 4, "the board has at least five lines")
		check.Equal(len(lines)-1, 5, "the number of lines printed")
		return lines[4]
	}

	check.Equal(specialFor("CRÊPE SUZETTE ; orange ; 7.50"), "Dish of the day: true", "the dish of the day typed in capitals")
	check.Equal(specialFor("Crêpe Suzette;orange;7.50"), "Dish of the day: true", "the dish of the day typed exactly as on the order pad")
	check.Equal(specialFor("crêpe ; butter ; 3.00"), "Dish of the day: false", "a shorter name that is not the dish of the day")
	check.Equal(specialFor("crêpe suzette flambée ; orange, brandy ; 9.50"), "Dish of the day: false", "a longer name that only contains the dish of the day")
	check.Equal(specialFor("galette complète ; ham; egg; cheese ; 9.00"), "Dish of the day: false", "another dish")
}
