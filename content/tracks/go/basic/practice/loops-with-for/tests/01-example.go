import "strings"

func Test(t *testing.T) {
	ran := check.RunScript("")
	lines := strings.Split(strings.TrimSuffix(ran.Out, "\n"), "\n")
	check.Equal(len(lines), 3, "the number of lines printed")
	check.Equal(lines[0], "10:20 10:45 11:10 11:35 13:15", "line 1, the departures")
	check.Equal(lines[1], "buses: 5", "line 2, the number of buses")
	check.Equal(lines[2], "next after 11:12: 11:35", "line 3, the next bus")
}
