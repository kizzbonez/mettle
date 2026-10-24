import "strings"

// boatLines runs main for one boat on a calm day and returns its lines.
func boatLines(name string) []string {
	boat, hours, wind = name, 2, 10
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 3, "main prints three lines")
	return lines
}

func Test(t *testing.T) {
	lines := boatLines("single")
	check.Equal(lines[0], "boat: single, 12 an hour", "a single kayak")
	check.Equal(lines[2], "to pay: 24", "the price of a single kayak for two hours")

	lines = boatLines("SOLO")
	check.Equal(lines[0], "boat: solo, 12 an hour", "a solo kayak typed in capitals")

	lines = boatLines("  Canoe ")
	check.Equal(lines[0], "boat: canoe, 25 an hour", "a canoe typed with spaces around the name")
	check.Equal(lines[2], "to pay: 50", "the price of a canoe for two hours")

	lines = boatLines("double")
	check.Equal(lines[0], "boat: double, 20 an hour", "a double kayak, the other name of a tandem")

	lines = boatLines(" Raft")
	check.Equal(lines[0], `boat: unknown " Raft"`, "a boat the hut does not have, quoted as typed")
	check.Equal(lines[1], "water: open sea", "the water is still reported for an unknown boat")
	check.Equal(lines[2], "to pay: nothing, no hire", "the price line for an unknown boat")
}
