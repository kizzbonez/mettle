import "strings"

// Puts other entries into the package-level variable and checks the underline.
func Test(t *testing.T) {
	underlineFor := func(typed string) string {
		entry = typed
		lines := strings.Split(check.PrintedBy(main), "\n")
		check.True(len(lines) > 1, "the board has at least two lines")
		return lines[1]
	}

	check.Equal(underlineFor("lemon & sugar ; lemon, sugar ; 4.00"), strings.Repeat("=", 13), "the underline of a name without accents")
	check.Equal(underlineFor("galette complète ; ham, egg ; 9.00"), strings.Repeat("=", 16), "the underline of a name with one accented letter")
	check.Equal(underlineFor("crème brûlée ; vanilla, caramel ; 5.50"), strings.Repeat("=", 12), "the underline of a name with several accented letters")
	check.Equal(underlineFor("   crêpe   ; butter ; 3.00"), strings.Repeat("=", 5), "the underline of a short name with spaces around it")
}
