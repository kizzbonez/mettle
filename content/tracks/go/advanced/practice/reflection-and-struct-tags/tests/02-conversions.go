type testBoat struct {
	Name     string  `form:"name"`
	Seats    int8    `form:"seats"`
	Length   int16   `form:"length_cm"`
	Year     int32   `form:"year"`
	Serial   int64   `form:"serial"`
	Paddles  int     `form:"paddles"`
	Buoyancy float32 `form:"buoyancy"`
	Price    float64 `form:"price"`
	Rudder   bool    `form:"rudder"`
}

func Test(t *testing.T) {
	var b testBoat
	err := fill(&b, map[string]string{
		"name": "  Kingfisher  ", "seats": "2", "length_cm": "-520", "year": "2019",
		"serial": "9007199254740993", "paddles": "+3", "buoyancy": "0.25", "price": "1e3", "rudder": "1",
	})
	check.NoError(err, "fill with a value for every kind of field")
	want := testBoat{Name: "Kingfisher", Seats: 2, Length: -520, Year: 2019, Serial: 9007199254740993,
		Paddles: 3, Buoyancy: 0.25, Price: 1000, Rudder: true}
	check.Equal(b, want, "every kind of field converted from text, with spaces removed")

	for _, text := range []string{"false", "F", "0", "FALSE"} {
		b.Rudder = true
		check.NoError(fill(&b, map[string]string{"rudder": text}), "fill with rudder "+text)
		check.True(!b.Rudder, "rudder "+text+" is false")
	}

	bad := []struct{ key, text string }{
		{"seats", "300"},
		{"seats", "-129"},
		{"length_cm", "40000"},
		{"year", "3000000000"},
		{"paddles", "2.5"},
		{"price", "a lot"},
		{"rudder", "yes"},
		{"buoyancy", "1e39"},
	}
	for _, c := range bad {
		err := fill(&b, map[string]string{c.key: c.text})
		check.ErrorIs(err, errBadValue, "fill with "+c.key+" "+c.text+" returns errBadValue: it does not fit the field")
		check.Equal(err.Error(), "fill: bad value \""+c.text+"\" for \""+c.key+"\"", "the message for "+c.key+" "+c.text)
	}

	check.NoError(fill(&b, map[string]string{"seats": "127", "length_cm": "-32768"}), "fill with the largest int8 and the smallest int16")
	check.Equal([]int{int(b.Seats), int(b.Length)}, []int{127, -32768}, "the largest int8 and the smallest int16")
}
