package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"slices"
)

// Heat is how spicy a dish is. In JSON it is written as its name.
type Heat int

const (
	Mild Heat = iota
	Hot
	Fiery
)

// heatNames holds the JSON name of each Heat, indexed by its value.
var heatNames = []string{"mild", "hot", "fiery"}

// Dish is one item on the menu. Recipe stays in the kitchen: it is never
// written to or read from JSON.
type Dish struct {
	Name       string   `json:"name"`
	PriceCents int      `json:"price_cents"`
	Heat       Heat     `json:"heat"`
	Vegan      bool     `json:"vegan,omitempty"`
	Allergens  []string `json:"allergens,omitempty"`
	Recipe     string   `json:"-"`
}

// Menu is the whole feed for one truck.
type Menu struct {
	Truck  string `json:"truck"`
	Dishes []Dish `json:"dishes"`
}

// MarshalJSON writes a Heat as its name, and refuses a value that has none.
func (h Heat) MarshalJSON() ([]byte, error) {
	if h < 0 || int(h) >= len(heatNames) {
		return nil, fmt.Errorf("invalid heat %d", int(h))
	}
	return json.Marshal(heatNames[h])
}

// UnmarshalJSON reads a Heat from its name.
func (h *Heat) UnmarshalJSON(data []byte) error {
	var name string
	if err := json.Unmarshal(data, &name); err != nil {
		return err
	}
	i := slices.Index(heatNames, name)
	if i < 0 {
		return fmt.Errorf("unknown heat %q", name)
	}
	*h = Heat(i)
	return nil
}

// readMenu decodes one menu from r, rejecting members that Menu and Dish do
// not have, and checks that every dish has a name and a positive price.
func readMenu(r io.Reader) (Menu, error) {
	dec := json.NewDecoder(r)
	dec.DisallowUnknownFields()
	var m Menu
	if err := dec.Decode(&m); err != nil {
		return Menu{}, fmt.Errorf("reading menu: %w", err)
	}
	for i, d := range m.Dishes {
		if d.Name == "" {
			return Menu{}, fmt.Errorf("dish %d: name is missing", i+1)
		}
		if d.PriceCents <= 0 {
			return Menu{}, fmt.Errorf("dish %d: price_cents must be positive", i+1)
		}
	}
	return m, nil
}

// writePriceList writes a "dish,price" header and one row per dish, with
// the price written with two decimals, such as 4.50. csv.Writer quotes the
// names that need it.
func writePriceList(w io.Writer, m Menu) error {
	cw := csv.NewWriter(w)
	if err := cw.Write([]string{"dish", "price"}); err != nil {
		return err
	}
	for _, d := range m.Dishes {
		price := fmt.Sprintf("%d.%02d", d.PriceCents/100, d.PriceCents%100)
		if err := cw.Write([]string{d.Name, price}); err != nil {
			return err
		}
	}
	cw.Flush()
	return cw.Error()
}
