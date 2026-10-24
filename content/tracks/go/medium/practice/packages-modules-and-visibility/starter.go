package main

// This file was cut out of the attendants' till program. Turn it into the
// library package deckchair: follow the numbered tasks in the instructions.
// Every exported name also needs a doc comment (task 6).

const DayCapHours = 5

var rates map[string]int

// Task 2: replace this init function with a declaration of rates that
// gives it its value.
func init() {
	rates = map[string]int{
		"deckchair":  250,
		"sunlounger": 400,
		"windbreak":  150,
	}
}

// Task 3: other packages must not be able to change the takings.
type Shift struct {
	Attendant string
	Takings   int
}

// Task 4.
func Price(kind string, hours int) (int, bool) {
	panic("not implemented")
}

// Task 5.
func Sell(s *Shift, kind string, hours int) (int, bool) {
	panic("not implemented")
}

// Task 5.
func Takings(s Shift) int {
	panic("not implemented")
}

// billable returns the hours a hire is charged for: at most DayCapHours.
func billable(hours int) int {
	if hours > DayCapHours {
		return DayCapHours
	}
	return hours
}
