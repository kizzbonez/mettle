package main

// Every method below has a value receiver. Task 4 asks you to decide, for each
// type, which receiver its methods should have.

// Ticket is the number on a cloakroom ticket. It is printed as C-001.
type Ticket int

// Task 1.
func (t Ticket) String() string {
	panic("not implemented")
}

// Tickets is a list of tickets, printed as C-002, C-003.
type Tickets []Ticket

// Task 1.
func (ts Tickets) String() string {
	panic("not implemented")
}

// Cloakroom holds coats on a fixed number of hooks. Use NewCloakroom to make one.
type Cloakroom struct {
	capacity int
	last     Ticket            // the last ticket handed out; numbers are never reused
	coats    map[Ticket]string // the coat on the hook of each ticket still out
}

// Task 2.
func NewCloakroom(capacity int) *Cloakroom {
	panic("not implemented")
}

// Task 3.
func (c Cloakroom) Check(coat string) (Ticket, bool) {
	panic("not implemented")
}

// Task 3.
func (c Cloakroom) Collect(t Ticket) (string, bool) {
	panic("not implemented")
}

// Task 3.
func (c Cloakroom) Free() int {
	panic("not implemented")
}

// Task 3.
func (c Cloakroom) Uncollected() Tickets {
	panic("not implemented")
}
