package main

import (
	"fmt"
	"maps"
	"slices"
	"strings"
)

// Ticket is the number on a cloakroom ticket. It is printed as C-001.
type Ticket int

// String formats the ticket as C- and its number, padded to three digits.
func (t Ticket) String() string {
	return fmt.Sprintf("C-%03d", int(t))
}

// Tickets is a list of tickets, printed as C-002, C-003.
type Tickets []Ticket

// String joins the tickets with commas, or returns "none" for an empty list.
func (ts Tickets) String() string {
	if len(ts) == 0 {
		return "none"
	}
	parts := make([]string, 0, len(ts))
	for _, t := range ts {
		parts = append(parts, t.String())
	}
	return strings.Join(parts, ", ")
}

// Cloakroom holds coats on a fixed number of hooks. Use NewCloakroom to make one.
type Cloakroom struct {
	capacity int
	last     Ticket            // the last ticket handed out; numbers are never reused
	coats    map[Ticket]string // the coat on the hook of each ticket still out
}

// NewCloakroom returns an empty cloakroom with capacity hooks.
func NewCloakroom(capacity int) *Cloakroom {
	return &Cloakroom{capacity: capacity, coats: map[Ticket]string{}}
}

// Check hangs up a coat and returns its ticket, or reports false when every hook is taken.
func (c *Cloakroom) Check(coat string) (Ticket, bool) {
	if len(c.coats) >= c.capacity {
		return 0, false
	}
	c.last++
	c.coats[c.last] = coat
	return c.last, true
}

// Collect hands back the coat for a ticket and frees its hook. It reports false for a
// ticket whose coat is not hanging in the cloakroom.
func (c *Cloakroom) Collect(t Ticket) (string, bool) {
	coat, ok := c.coats[t]
	if !ok {
		return "", false
	}
	delete(c.coats, t)
	return coat, true
}

// Free returns how many hooks are free. It only reads the cloakroom, but it has a pointer
// receiver like the other methods, so that the whole API works on one shared cloakroom.
func (c *Cloakroom) Free() int {
	return c.capacity - len(c.coats)
}

// Uncollected returns the tickets whose coats are still hanging, lowest first.
func (c *Cloakroom) Uncollected() Tickets {
	return slices.Sorted(maps.Keys(c.coats))
}
