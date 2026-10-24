func Test(t *testing.T) {
	cards := []string{
		"Dee:Fig",
		" Eli : FIG ",
		"Dee:fig",
		"Fay:olive:tree",
		"Gus:",
		":lemon",
		"Hal lemon",
		"Eli:Lemon",
		"dee:fig",
	}
	want := map[string][]string{
		"fig":        {"Dee", "Eli", "dee"},
		"olive:tree": {"Fay"},
		"lemon":      {"Eli"},
	}
	check.Equal(wishlists(cards), want, "wish cards grouped by lower-case plant, people in card order and listed once")
	check.Equal(len(wishlists([]string{"no colon here", "Ivy:", ":"})), 0, "cards with no colon or an empty part are skipped")
	check.Equal(len(wishlists(nil)), 0, "no cards give no wishes")
}
