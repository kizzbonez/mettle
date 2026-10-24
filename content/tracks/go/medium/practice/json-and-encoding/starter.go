package main

import "io"

// Heat is how spicy a dish is. In JSON it is written as its name.
type Heat int

const (
	Mild Heat = iota
	Hot
	Fiery
)

// Task 1: add struct tags so that Dish and Menu marshal as the
// instructions show.
type Dish struct {
	Name       string
	PriceCents int
	Heat       Heat
	Vegan      bool
	Allergens  []string
	Recipe     string
}

type Menu struct {
	Truck  string
	Dishes []Dish
}

// Task 2: MarshalJSON writes a Heat as its name.
func (h Heat) MarshalJSON() ([]byte, error) {
	panic("not implemented")
}

// Task 2: UnmarshalJSON reads a Heat from its name.
func (h *Heat) UnmarshalJSON(data []byte) error {
	panic("not implemented")
}

// Task 3: readMenu decodes one menu from r and checks its dishes.
func readMenu(r io.Reader) (Menu, error) {
	panic("not implemented")
}

// Task 4: writePriceList writes the menu's prices to w as CSV.
func writePriceList(w io.Writer, m Menu) error {
	panic("not implemented")
}
