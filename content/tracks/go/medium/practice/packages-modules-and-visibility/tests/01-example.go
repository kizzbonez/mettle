import "fmt"

func Test(t *testing.T) {
	check.Equal(fmt.Sprintf("%T", Shift{}), "deckchair.Shift", "the package name, as other packages see it in Shift's type")

	price, ok := Price("deckchair", 2)
	check.True(ok, `Price("deckchair", 2) reports true`)
	check.Equal(price, 500, `Price("deckchair", 2)`)
	price, ok = Price("sunlounger", 7)
	check.True(ok, `Price("sunlounger", 7) reports true`)
	check.Equal(price, 2000, `Price("sunlounger", 7), charged for DayCapHours`)
	price, ok = Price("hammock", 2)
	check.True(!ok && price == 0, `Price("hammock", 2) gives 0 and false`)
	price, ok = Price("windbreak", 0)
	check.True(!ok && price == 0, `Price("windbreak", 0) gives 0 and false`)

	s := &Shift{Attendant: "Mo"}
	price, ok = Sell(s, "deckchair", 3)
	check.True(ok && price == 750, `Sell(s, "deckchair", 3) gives 750 and true`)
	price, ok = Sell(s, "windbreak", 1)
	check.True(ok && price == 150, `Sell(s, "windbreak", 1) gives 150 and true`)
	price, ok = Sell(s, "hammock", 1)
	check.True(!ok && price == 0, `Sell(s, "hammock", 1) gives 0 and false`)
	check.Equal(Takings(*s), 900, "Takings(*s) after the three sales")
}
