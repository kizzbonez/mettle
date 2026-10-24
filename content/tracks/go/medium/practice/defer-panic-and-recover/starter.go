package main

// Add "fmt" and "strings" to the imports when your code uses them.

// Logbook records what the reset did, one line per action.
type Logbook struct {
	Lines []string
}

func (lb *Logbook) add(line string) {
	lb.Lines = append(lb.Lines, line)
}

// Task 1: log "begin <name>" at once and return a function that logs
// "end <name>". Call it as: defer section("reset", lb)()
func section(name string, lb *Logbook) func() {
	panic("not implemented")
}

// Task 2: unlock each door in turn and run probe on it. Stop at the first
// door whose probe fails or panics. Lock every unlocked door again, in reverse
// order, however inspect returns.
func inspect(doors []string, probe func(door string) error, lb *Logbook) (err error) {
	panic("not implemented")
}

// Task 3: split a fixed list such as "Vault, Library" into door names, and
// panic on an empty name.
func mustDoors(spec string) []string {
	panic("not implemented")
}
