import "strings"

// Puts other names in the package-level variables, then calls main.
func Test(t *testing.T) {
	operator, attendant = "Lin", "Raf"
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) > 4, "the board has at least five lines")
	check.Equal(lines[3], "Morning: Lin at the controls, Raf at the gate", "the morning line, with the names from the variables")
	check.Equal(lines[4], "Afternoon: Raf at the controls, Lin at the gate", "the afternoon line, with the two names swapped")
	check.True(operator == "Raf" && attendant == "Lin", "after main, the package-level variables operator and attendant hold the swapped names")

	// A second call starts from the afternoon roles and swaps them back.
	lines = strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) > 4, "the board has at least five lines")
	check.Equal(lines[4], "Afternoon: Lin at the controls, Raf at the gate", "the afternoon line when main runs a second time")
}
