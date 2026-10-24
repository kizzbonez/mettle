import "strings"

// Puts other entries into the package-level variable, then calls main.
func Test(t *testing.T) {
	boardFor := func(typed string) []string {
		entry = typed
		lines := strings.Split(check.PrintedBy(main), "\n")
		check.True(len(lines) > 4, "the board has at least five lines")
		return lines
	}

	lines := boardFor("galette complète ; ham; egg; cheese ; 9.00")
	check.Equal(lines[0], "GALETTE COMPLÈTE", "the name of an entry whose fillings contain semicolons")
	check.Equal(lines[2], "With: ham; egg; cheese", "fillings that contain semicolons themselves")
	check.Equal(lines[3], "Price: 9.00 euros", "the price after the last semicolon")

	lines = boardFor("lemon & sugar;lemon, sugar;4.00")
	check.Equal(lines[0], "LEMON & SUGAR", "the name of an entry without any spaces around the semicolons")
	check.Equal(lines[2], "With: lemon, sugar", "the fillings of an entry without spaces")
	check.Equal(lines[3], "Price: 4.00 euros", "the price of an entry without spaces")

	lines = boardFor("\tbanana split ;  banana, chocolate\t;  6.20 \n")
	check.Equal(lines[0], "BANANA SPLIT", "the name, with a tab in front of it removed")
	check.Equal(lines[2], "With: banana, chocolate", "the fillings, with spaces and a tab around them removed")
	check.Equal(lines[3], "Price: 6.20 euros", "the price, with spaces and a new line after it removed")
}
