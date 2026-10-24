func Test(t *testing.T) {
	framed := NewFramed("Low Tide", 2950, 1250)
	check.Equal(framed.Title, "Low Tide", "the title of a framed print, through the promoted field")
	check.Equal(framed.Pence, 2950, "the print's own price, through the promoted field")
	check.Equal(framed.FramePence, 1250, "the price of the frame")
	check.Equal(framed.Price(), 4200, "the price of a framed print")
	check.Equal(framed.Print.Price(), 2950, "the embedded print keeps its own price")
	check.Equal(framed.Label(), "Low Tide, framed £42.00", "the label of a framed print")
	check.Equal(framed.Print.Label(), "Low Tide £29.50", "the embedded print keeps its own label")

	cheap := Framed{Title: "Boats", Pence: 5, FramePence: 0}
	check.Equal(cheap.Label(), "Boats, framed £0.05", "the label of a framed print that costs five pence")
	check.Equal(NewFramed("Pier", 0, 999).Label(), "Pier, framed £9.99", "the label of a framed print whose print is free")
	check.Equal(Print{Title: "Pier", Pence: 1005}.Label(), "Pier £10.05", "a bare print's label is unchanged")
}
