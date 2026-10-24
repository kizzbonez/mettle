package main

import (
	"fmt"
	"strings"
)

// Guest is a pet staying at the hotel.
type Guest interface {
	// Nightly returns the price of one night, in pence.
	Nightly() int
}

// Dog is a dog guest. Dogs are priced by weight.
type Dog struct {
	Name  string
	Kilos int
}

// Cat is a cat guest.
type Cat struct {
	Name string
}

// Parrot is a parrot guest, which learns words during its stay.
type Parrot struct {
	Name  string
	Words []string
}

// The guest types, checked at compile time. Only *Parrot is a Guest, because
// Parrot's methods have pointer receivers.
var (
	_ Guest = Dog{}
	_ Guest = Cat{}
	_ Guest = (*Parrot)(nil)
)

// Nightly returns 2500 for a dog of up to 10 kg and 3500 for a heavier one.
func (d Dog) Nightly() int {
	if d.Kilos > 10 {
		return 3500
	}
	return 2500
}

// Nightly returns the flat rate for a cat.
func (c Cat) Nightly() int {
	return 1800
}

// Learn adds a word the parrot has picked up.
func (p *Parrot) Learn(word string) {
	p.Words = append(p.Words, word)
}

// Nightly returns the flat rate for a parrot.
func (p *Parrot) Nightly() int {
	return 2000
}

// RuleError reports why a guest cannot stay.
type RuleError struct {
	Name string
	Rule string
}

// Error returns the guest's name and the rule that keeps it out.
func (e *RuleError) Error() string {
	return e.Name + ": " + e.Rule
}

// checkDog returns a *RuleError for a dog the hotel cannot take, and nil otherwise.
func checkDog(d Dog) *RuleError {
	if d.Kilos > 40 {
		return &RuleError{Name: d.Name, Rule: "dogs over 40 kg are not admitted"}
	}
	return nil
}

// Bill returns what a stay of nights nights costs for all the guests, in pence.
func Bill(guests []Guest, nights int) int {
	total := 0
	for _, g := range guests {
		total += g.Nightly() * nights
	}
	return total
}

// Describe returns one line about a guest for the guest list.
func Describe(g Guest) string {
	switch g := g.(type) {
	case Dog:
		return fmt.Sprintf("%s, a dog of %d kg", g.Name, g.Kilos)
	case Cat:
		return g.Name + ", a cat"
	case *Parrot:
		if len(g.Words) == 0 {
			return g.Name + ", a parrot"
		}
		return g.Name + ", a parrot that says " + strings.Join(g.Words, ", ")
	default:
		return fmt.Sprintf("a guest at %d a night", g.Nightly())
	}
}

// Walks returns the names of the dogs among the guests, in their order.
func Walks(guests []Guest) []string {
	var names []string
	for _, g := range guests {
		if d, ok := g.(Dog); ok {
			names = append(names, d.Name)
		}
	}
	return names
}

// Admit returns nil when the hotel can take the guest, or the reason it cannot.
func Admit(g Guest) error {
	if d, ok := g.(Dog); ok {
		if err := checkDog(d); err != nil {
			return err
		}
	}
	// A literal nil: returning the *RuleError variable itself would give a
	// non-nil error that holds a nil pointer.
	return nil
}
