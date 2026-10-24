import (
	"bytes"
	"errors"
	"strings"
)

var errStallFull = errors.New("the stall's screen is full")

// brokenScreen fails every write.
type brokenScreen struct{}

func (brokenScreen) Write(p []byte) (int, error) { return 0, errStallFull }

func Test(t *testing.T) {
	menu, err := readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[]}`))
	check.NoError(err, "readMenu of a menu with no dishes")
	check.Equal(menu.Truck, "Saltmarsh", "the truck of a menu with no dishes")

	_, err = readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[{"name":"Pie","price_cents":500,"heat":"mild","gravy":true}]}`))
	check.Error(err, "readMenu rejects a dish with a member Dish does not have")

	_, err = readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[{"name":"Pie","price_cents":500,"heat":"mild"}`))
	check.Error(err, "readMenu rejects JSON that stops in the middle")

	menu, err = readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[{"name":"Pie","price_cents":500,"heat":"warm"}]}`))
	check.Error(err, "readMenu rejects a dish with an unknown heat")
	check.Equal(menu.Truck, "", "readMenu returns the zero Menu with an error")

	menu, err = readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[{"name":"Pie","price_cents":500},{"price_cents":300}]}`))
	check.Error(err, "readMenu rejects a dish without a name")
	if err != nil {
		check.Equal(err.Error(), "dish 2: name is missing", "the error for a dish without a name, numbered from 1")
	}
	check.Equal(len(menu.Dishes), 0, "readMenu returns no dishes with an error")

	_, err = readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[{"name":"Pie","price_cents":500},{"name":"Tea","price_cents":120},{"name":"Free sample","price_cents":0}]}`))
	check.Error(err, "readMenu rejects a dish with a price of 0")
	if err != nil {
		check.Equal(err.Error(), "dish 3: price_cents must be positive", "the error for a dish whose price is not above 0")
	}
	_, err = readMenu(strings.NewReader(`{"truck":"Saltmarsh","dishes":[{"name":"Refund","price_cents":-200}]}`))
	check.Error(err, "readMenu rejects a negative price")

	var buf bytes.Buffer
	m := Menu{Truck: "Saltmarsh", Dishes: []Dish{
		{Name: "Mint", PriceCents: 5},
		{Name: "Big \"Saltmarsh\" burger", PriceCents: 1250},
		{Name: "Soup", PriceCents: 400},
		{Name: "Cake", PriceCents: 1099},
	}}
	check.NoError(writePriceList(&buf, m), "writePriceList of four dishes")
	check.Equal(buf.String(), "dish,price\nMint,0.05\n\"Big \"\"Saltmarsh\"\" burger\",12.50\nSoup,4.00\nCake,10.99\n", "the price list: header, menu order, two decimals and quoting")

	buf.Reset()
	check.NoError(writePriceList(&buf, Menu{Truck: "Saltmarsh"}), "writePriceList of a menu with no dishes")
	check.Equal(buf.String(), "dish,price\n", "a menu with no dishes gives only the header")

	err = writePriceList(brokenScreen{}, m)
	check.ErrorIs(err, errStallFull, "writePriceList returns the error of a writer that fails")
}
