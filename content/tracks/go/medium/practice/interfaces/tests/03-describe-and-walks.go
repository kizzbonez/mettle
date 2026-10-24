// hamster is a kind of guest that the hotel's code does not know about.
type hamster struct{}

func (hamster) Nightly() int { return 900 }

func Test(t *testing.T) {
	check.Equal(Describe(Dog{Name: "Bea", Kilos: 10}), "Bea, a dog of 10 kg", "describing a dog")
	check.Equal(Describe(Cat{Name: "Sooty"}), "Sooty, a cat", "describing a cat")
	check.Equal(Describe(&Parrot{Name: "Polly"}), "Polly, a parrot", "describing a parrot that has learnt no words")
	polly := &Parrot{Name: "Polly"}
	polly.Learn("hello")
	polly.Learn("goodbye")
	polly.Learn("biscuit")
	check.Equal(Describe(polly), "Polly, a parrot that says hello, goodbye, biscuit", "describing a parrot that has learnt three words")
	check.Equal(Describe(hamster{}), "a guest at 900 a night", "describing a kind of guest the switch has no case for")

	guests := []Guest{
		Cat{Name: "Tom"},
		Dog{Name: "Pip", Kilos: 3},
		polly,
		Dog{Name: "Max", Kilos: 30},
		hamster{},
		Dog{Name: "Ada", Kilos: 8},
	}
	check.Equal(Walks(guests), []string{"Pip", "Max", "Ada"}, "the dogs to walk, in the order of the guests")
	check.Equal(len(Walks([]Guest{Cat{Name: "Tom"}, polly})), 0, "no walks when there are no dogs")
	check.Equal(len(Walks(nil)), 0, "no walks for no guests")
}
