func Test(t *testing.T) {
	check.Equal(Dog{Name: "Pip", Kilos: 3}.Nightly(), 2500, "a small dog's nightly rate")
	check.Equal(Dog{Name: "Bea", Kilos: 10}.Nightly(), 2500, "the nightly rate of a dog of exactly 10 kg")
	check.Equal(Dog{Name: "Max", Kilos: 11}.Nightly(), 3500, "the nightly rate of a dog of 11 kg")
	check.Equal(Cat{Name: "Tom"}.Nightly(), 1800, "a cat's nightly rate")
	check.Equal((&Parrot{Name: "Polly"}).Nightly(), 2000, "a parrot's nightly rate")

	check.Equal(Bill(nil, 4), 0, "the bill for no guests")
	check.Equal(Bill([]Guest{Cat{Name: "Tom"}}, 0), 0, "the bill for zero nights")
	check.Equal(Bill([]Guest{Cat{Name: "Tom"}}, 1), 1800, "one cat for one night")
	mixed := []Guest{
		Dog{Name: "Pip", Kilos: 3},
		Dog{Name: "Max", Kilos: 30},
		&Parrot{Name: "Polly"},
		Cat{Name: "Tom"},
		Cat{Name: "Sooty"},
	}
	check.Equal(Bill(mixed, 7), 81200, "two dogs, a parrot and two cats for a week")
}
