package main

import "fmt"

// Pricer is anything with a price in pence.
type Pricer interface {
	Price() int
}

// Labeller is anything with a shelf label.
type Labeller interface {
	Label() string
}

// Item is what the counter sells: it has a price and a shelf label.
type Item interface {
	Pricer
	Labeller
}

// Print is an unframed art print.
type Print struct {
	Title string
	Pence int
}

// Price returns the price of the print.
func (p Print) Price() int {
	return p.Pence
}

// Label returns the print's title and price, such as "Harbour at Dawn £24.00".
func (p Print) Label() string {
	return p.Title + " " + pounds(p.Price())
}

// pounds formats pence as pounds and pence, such as £24.00.
func pounds(pence int) string {
	return fmt.Sprintf("£%d.%02d", pence/100, pence%100)
}

// Framed is a print in an oak frame. Its Title and Pence are promoted from Print.
type Framed struct {
	Print
	FramePence int
}

// NewFramed returns a framed print, set up with a Go 1.27 promoted-field literal.
func NewFramed(title string, pence, framePence int) Framed {
	return Framed{Title: title, Pence: pence, FramePence: framePence}
}

// Price returns the price of the print and the frame together.
func (f Framed) Price() int {
	return f.Print.Price() + f.FramePence
}

// Label returns the label of a framed print, with the framed price. Print's own
// Label would call Print.Price, so Framed needs a Label of its own.
func (f Framed) Label() string {
	return f.Title + ", framed " + pounds(f.Price())
}

// Sale is any item with a percentage off its price. Its Label is promoted from
// the item, so the shelf label does not change.
type Sale struct {
	Item
	Percent int
}

// Price returns the item's price less Percent percent, rounded down to a whole penny.
func (s Sale) Price() int {
	return s.Item.Price() * (100 - s.Percent) / 100
}

// Total returns the price of all the items together.
func Total(items []Item) int {
	total := 0
	for _, item := range items {
		total += item.Price()
	}
	return total
}
