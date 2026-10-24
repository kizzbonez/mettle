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
// Task 1: declare it by embedding Pricer and Labeller.
type Item interface{}

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

// Task 2: one struct literal, with the promoted fields as keys.
func NewFramed(title string, pence, framePence int) Framed {
	panic("not implemented")
}

// Task 3: Price, and a Label of Framed's own.
func (f Framed) Price() int {
	panic("not implemented")
}

// Sale is any item with a percentage off its price. It embeds the Item
// interface, so it has every method of Item, passed on to the item it holds.
type Sale struct {
	Item
	Percent int
}

// Task 4.
func (s Sale) Price() int {
	panic("not implemented")
}

// Task 5.
func Total(items []Item) int {
	panic("not implemented")
}
