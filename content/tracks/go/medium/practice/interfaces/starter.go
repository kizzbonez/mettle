package main

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

// Task 1: 2500 for a dog of up to 10 kg, 3500 for a heavier one.
func (d Dog) Nightly() int {
	panic("not implemented")
}

// Task 1: the flat rate for a cat.
func (c Cat) Nightly() int {
	panic("not implemented")
}

// Learn adds a word the parrot has picked up.
func (p *Parrot) Learn(word string) {
	p.Words = append(p.Words, word)
}

// Task 1: the flat rate for a parrot.
func (p *Parrot) Nightly() int {
	panic("not implemented")
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

// Task 2.
func Bill(guests []Guest, nights int) int {
	panic("not implemented")
}

// Task 3.
func Describe(g Guest) string {
	panic("not implemented")
}

// Task 4.
func Walks(guests []Guest) []string {
	panic("not implemented")
}

// Task 5.
func Admit(g Guest) error {
	panic("not implemented")
}
