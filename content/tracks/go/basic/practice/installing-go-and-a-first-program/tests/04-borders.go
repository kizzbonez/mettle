import "strings"

func Test(t *testing.T) {
	banner := check.RunScript("")
	lines := strings.Split(banner.Out, "\n")
	border := strings.Repeat("=", 30)
	check.Equal(len(lines)-1, 7, "the number of lines printed")
	check.Equal(lines[0], border, "the top border, 30 = signs")
	check.Equal(lines[3], border, "the bottom border of the title, 30 = signs")
	check.Equal(lines[6], "Please switch off your phone", "the last line of the banner")
	check.Equal(banner.Err, "", "nothing printed as an error")
	check.Equal(banner.Code, 0, "the exit code of the program")
}
