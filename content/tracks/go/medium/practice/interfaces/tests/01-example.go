func Test(t *testing.T) {
	kiwi := &Parrot{Name: "Kiwi"}
	kiwi.Learn("hello")
	guests := []Guest{Dog{Name: "Rex", Kilos: 12}, Cat{Name: "Mog"}, kiwi}

	check.Equal(Bill(guests, 3), 21900, "Bill(guests, 3)")
	check.Equal(Describe(guests[0]), "Rex, a dog of 12 kg", "Describe(guests[0])")
	check.Equal(Describe(guests[1]), "Mog, a cat", "Describe(guests[1])")
	check.Equal(Describe(kiwi), "Kiwi, a parrot that says hello", "Describe(kiwi)")
	check.Equal(Walks(guests), []string{"Rex"}, "Walks(guests)")

	err := Admit(Dog{Name: "Bruno", Kilos: 45})
	check.Error(err, `Admit(Dog{Name: "Bruno", Kilos: 45}) returns an error`)
	check.Equal(err.Error(), "Bruno: dogs over 40 kg are not admitted", "the error for Bruno")
	check.True(Admit(Cat{Name: "Mog"}) == nil, `Admit(Cat{Name: "Mog"}) == nil`)
	check.True(Admit(guests[0]) == nil, "Admit(guests[0]) == nil")
}
