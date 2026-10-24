package main

import (
	"fmt"
	"strings"
)

// Logbook records what the reset did, one line per action.
type Logbook struct {
	Lines []string
}

func (lb *Logbook) add(line string) {
	lb.Lines = append(lb.Lines, line)
}

// section logs "begin <name>" at once and returns a function that logs
// "end <name>". Call it as: defer section("reset", lb)()
func section(name string, lb *Logbook) func() {
	lb.add("begin " + name)
	return func() {
		lb.add("end " + name)
	}
}

// inspect unlocks each door in turn and runs probe on it. It stops at the
// first door whose probe fails or panics. Every door it unlocked is locked
// again, in reverse order, however inspect returns.
func inspect(doors []string, probe func(door string) error, lb *Logbook) (err error) {
	current := ""
	// Deferred first, so it runs last: after every door has been locked.
	defer func() {
		r := recover()
		if r == nil {
			return
		}
		if cause, ok := r.(error); ok {
			err = fmt.Errorf("door %s: panic: %w", current, cause)
			return
		}
		err = fmt.Errorf("door %s: panic: %v", current, r)
	}()

	for _, door := range doors {
		current = door
		lb.add("unlock " + door)
		defer lb.add("lock " + door) // the argument is built now, with this door
		if cause := probe(door); cause != nil {
			return fmt.Errorf("door %s: %w", door, cause)
		}
	}
	lb.add("all clear")
	return nil
}

// mustDoors splits a fixed list such as "Vault, Library" into door names.
// An empty name is a bug in the program, so it panics.
func mustDoors(spec string) []string {
	parts := strings.Split(spec, ",")
	for i, part := range parts {
		name := strings.TrimSpace(part)
		if name == "" {
			panic(fmt.Sprintf("mustDoors: empty door name in %q", spec))
		}
		parts[i] = name
	}
	return parts
}
