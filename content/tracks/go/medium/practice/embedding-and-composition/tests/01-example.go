// exampleLabel returns v's shelf label, or "" when v has no Label method.
func exampleLabel(v any) string {
	if l, ok := v.(Labeller); ok {
		return l.Label()
	}
	return ""
}

func Test(t *testing.T) {
	dawn := Print{Title: "Harbour at Dawn", Pence: 2400}
	gulls := NewFramed("Gulls", 1800, 1500)
	check.Equal(gulls, Framed{Print: Print{Title: "Gulls", Pence: 1800}, FramePence: 1500}, `NewFramed("Gulls", 1800, 1500)`)
	check.Equal(gulls.Title, "Gulls", "gulls.Title, promoted from Print")
	check.Equal(dawn.Label(), "Harbour at Dawn £24.00", "dawn.Label()")
	check.Equal(gulls.Price(), 3300, "gulls.Price()")
	check.Equal(gulls.Label(), "Gulls, framed £33.00", "gulls.Label()")

	sale := Sale{Item: gulls, Percent: 25}
	check.Equal(sale.Price(), 2475, "sale.Price() for 25% off the framed gulls")
	check.Equal(exampleLabel(sale), "Gulls, framed £33.00", "sale.Label(), the framed print's own label")
	check.Equal(Total([]Item{dawn, gulls, sale}), 8175, "Total([]Item{dawn, gulls, sale})")
}
