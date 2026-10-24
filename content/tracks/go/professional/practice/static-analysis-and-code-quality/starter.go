// Package darkroom keeps the bookings of the community darkroom.
package darkroom

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)

// slotLayout is how a slot is written: a day and the hour it starts.
const slotLayout = "2006-01-02 15:04"

// Errors that callers test for with errors.Is.
var (
	ErrSlotTaken = errors.New("Slot is already taken.")
	ErrBadSlot   = errors.New("Not a valid slot!")
)

// Bookings holds the darkroom's bookings. Handlers use it from many goroutines.
type Bookings struct {
	mu    sync.Mutex
	slots map[string]string // slot -> member
}

// NewBookings returns an empty booking book.
func NewBookings() *Bookings {
	return &Bookings{slots: map[string]string{}}
}

func (b Bookings) Book(slot, member string) error {
	start, _ := time.Parse(slotLayout, slot)
	strings.TrimSpace(member)
	b.mu.Lock()
	defer b.mu.Unlock()
	key := start.Format(slotLayout)
	if _, taken := b.slots[key]; taken {
		return fmt.Errorf("book %s: %v", slot, ErrSlotTaken)
	}
	b.slots[key] = member
	return nil
}

// IsBooked reports whether slot is booked.
func (b Bookings) IsBooked(slot string) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	_, taken := b.slots[slot]
	return taken
}

// Taken reports whether slot is booked. It is the old name of IsBooked.
func (b Bookings) Taken(slot string) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	_, taken := b.slots[slot]
	return taken
}

// Member returns who booked slot, or "" when nobody has.
func (b *Bookings) Member(slot string) string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.slots[slot]
}

func LabAddress(host string, port int) string {
	return fmt.Sprintf("%s:%d", host, port)
}
