package main

import "strings"

// Bowler is one league member's season.
type Bowler struct {
	Name     string
	Games    []int // scores, in the order played
	Handicap *int  // nil until the secretary sets one
}

// The league's handicap: 90% of the gap between a bowler's average and 200.
const (
	handicapBase    = 200
	handicapPercent = 90
)

// addGame records a score from 0 to 300 and reports whether it did.
func addGame(b *Bowler, score int) bool {
	if score < 0 || score > 300 {
		return false
	}
	b.Games = append(b.Games, score)
	return true
}

// findBowler returns a pointer to the team member called name, or nil.
func findBowler(team []Bowler, name string) *Bowler {
	for i := range team {
		if strings.EqualFold(team[i].Name, name) {
			return &team[i] // the element itself, not a copy
		}
	}
	return nil
}

// setHandicap sets the handicap from the average of the bowler's games.
func setHandicap(b *Bowler) {
	if len(b.Games) == 0 {
		return // no games, no handicap yet
	}
	sum := 0
	for _, score := range b.Games {
		sum += score
	}
	average := sum / len(b.Games)
	handicap := (handicapBase - average) * handicapPercent / 100
	if handicap < 0 {
		handicap = 0
	}
	b.Handicap = new(handicap)
}

// handicapOf returns the handicap, or 0 for a nil bowler or no handicap.
func handicapOf(b *Bowler) int {
	if b == nil || b.Handicap == nil {
		return 0
	}
	return *b.Handicap
}
