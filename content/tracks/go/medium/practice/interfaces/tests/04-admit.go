// gecko is a kind of guest that the hotel's code does not know about.
type gecko struct{}

func (gecko) Nightly() int { return 700 }

func Test(t *testing.T) {
	check.True(Admit(Dog{Name: "Pip", Kilos: 3}) == nil, "Admit of a small dog gives an error equal to nil")
	check.True(Admit(Dog{Name: "Rufus", Kilos: 40}) == nil, "Admit of a dog of exactly 40 kg gives an error equal to nil")
	check.True(Admit(&Parrot{Name: "Polly"}) == nil, "Admit of a parrot gives an error equal to nil")
	check.True(Admit(Cat{Name: "Tom"}) == nil, "Admit of a cat gives an error equal to nil")
	check.True(Admit(gecko{}) == nil, "Admit of a kind of guest the hotel does not know gives an error equal to nil")

	err := Admit(Dog{Name: "Bruno", Kilos: 41})
	check.Error(err, "Admit of a dog of 41 kg returns an error")
	rule := check.ErrorAs[*RuleError](err, "the error for a large dog is a *RuleError")
	check.True(rule != nil && rule.Name == "Bruno", "the *RuleError names the dog")
	check.Equal(err.Error(), "Bruno: dogs over 40 kg are not admitted", "the message for a large dog")
}
