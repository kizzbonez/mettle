// Package deckchair prices the hire of beach furniture on the promenade and
// keeps each attendant's takings for the day.
package deckchair

// DayCapHours is the most hours a hire is charged for: a longer hire costs
// the same as one of DayCapHours hours.
const DayCapHours = 5

// rates holds the price of one hour's hire of each kind, in pence.
var rates = map[string]int{
	"deckchair":  250,
	"sunlounger": 400,
	"windbreak":  150,
}

// Shift is one attendant's working day at the stand.
type Shift struct {
	Attendant string
	takings   int // pence taken so far; only Sell changes it
}

// Price returns what hiring one item of the given kind for hours hours costs,
// in pence. It reports false, with a price of 0, for a kind the stand does not
// hire out or for fewer than one hour.
func Price(kind string, hours int) (int, bool) {
	rate, ok := rates[kind]
	if !ok || hours < 1 {
		return 0, false
	}
	return rate * billable(hours), true
}

// Sell prices a hire with Price and adds it to the shift's takings. A hire
// that Price refuses is not added.
func Sell(s *Shift, kind string, hours int) (int, bool) {
	price, ok := Price(kind, hours)
	if ok {
		s.takings += price
	}
	return price, ok
}

// Takings returns the pence the shift has taken so far.
func Takings(s Shift) int {
	return s.takings
}

// billable returns the hours a hire is charged for: at most DayCapHours.
func billable(hours int) int {
	if hours > DayCapHours {
		return DayCapHours
	}
	return hours
}
