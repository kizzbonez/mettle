package main

// You will need the package strings: add an import for it when you use it.

// Bowler is one league member's season.
type Bowler struct {
	Name     string
	Games    []int // scores, in the order played
	Handicap *int  // nil until the secretary sets one
}

// addGame records a score from 0 to 300 and reports whether it did.
func addGame(b *Bowler, score int) bool {
	panic("not implemented")
}

// findBowler returns a pointer to the team member called name, or nil.
func findBowler(team []Bowler, name string) *Bowler {
	panic("not implemented")
}

// setHandicap sets the handicap from the average of the bowler's games.
func setHandicap(b *Bowler) {
	panic("not implemented")
}

// handicapOf returns the handicap, or 0 for a nil bowler or no handicap.
func handicapOf(b *Bowler) int {
	panic("not implemented")
}
