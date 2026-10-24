// saleLabel returns v's shelf label, or "" when v has no Label method.
func saleLabel(v any) string {
	if l, ok := v.(Labeller); ok {
		return l.Label()
	}
	return ""
}

func Test(t *testing.T) {
	bare := Print{Title: "Lobster Pots", Pence: 1999}
	check.Equal(Sale{Item: bare, Percent: 10}.Price(), 1799, "10% off 1999 pence, rounded down")
	check.Equal(Sale{Item: bare, Percent: 0}.Price(), 1999, "a sale of 0%")
	check.Equal(Sale{Item: bare, Percent: 100}.Price(), 0, "a sale of 100%")
	check.Equal(saleLabel(Sale{Item: bare, Percent: 30}), "Lobster Pots £19.99", "a sale keeps the bare print's label")

	framed := NewFramed("Lighthouse", 3000, 2000)
	onSale := Sale{Item: framed, Percent: 20}
	check.Equal(onSale.Price(), 4000, "a sale on a framed print takes the percentage off the framed price")
	check.Equal(saleLabel(onSale), "Lighthouse, framed £50.00", "a sale keeps the framed print's label")

	twice := Sale{Item: onSale, Percent: 50}
	check.Equal(twice.Price(), 2000, "a sale on an item that is already on sale")

	check.Equal(Total(nil), 0, "the total of no items")
	check.Equal(Total([]Item{bare}), 1999, "the total of one item")
	check.Equal(Total([]Item{bare, framed, onSale, twice}), 12999, "the total of a mixed basket")
}
