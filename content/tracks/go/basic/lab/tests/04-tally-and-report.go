func Test(t *testing.T) {
	check.Equal(len(tally(nil)), 0, "the tally of no sales has no stalls")

	sales := []Sale{
		{Stall: "waffles", Cents: 500},
		{Stall: "bao", Cents: 675, Card: true},
		{Stall: "waffles", Cents: 250, Card: true},
		{Stall: "waffles", Cents: 125},
		{Stall: "bao", Cents: 675, Card: true},
	}
	before := append([]Sale(nil), sales...)
	check.Equal(tally(sales), map[string]Takings{
		"waffles": {Sales: 3, Cash: 625, Card: 250},
		"bao":     {Sales: 2, Cash: 0, Card: 1350},
	}, "the tally counts each stall's sales and adds its cash and card separately")
	check.Equal(sales, before, "tally leaves the sales unchanged")

	totals := map[string]Takings{
		"tacos":     {Sales: 4, Cash: 1999, Card: 0},
		"arepas":    {Sales: 1, Cash: 0, Card: 1999},
		"pierogi":   {Sales: 2, Cash: 1000, Card: 2500},
		"gelato":    {Sales: 6, Cash: 300, Card: 1205},
		"kombucha":  {Sales: 1, Cash: 5, Card: 0},
		"falafel":   {Sales: 3, Cash: 1250, Card: 1250},
		"bubbletea": {Sales: 5, Cash: 0, Card: 2000},
	}
	want := []string{
		"stall      sales      cash      card     total      fee",
		"arepas         1      0.00     19.99     19.99     1.99",
		"bubbletea      5      0.00     20.00     20.00     2.00",
		"falafel        3     12.50     12.50     25.00     2.50",
		"gelato         6      3.00     12.05     15.05     1.50",
		"kombucha       1      0.05      0.00      0.05     0.00",
		"pierogi        2     10.00     25.00     35.00     3.50",
		"tacos          4     19.99      0.00     19.99     1.99",
		"TOTAL         22     45.54     89.54    135.08    13.48",
	}
	for range 3 {
		check.Equal(report(totals, 10), want, "the report rows in alphabetical order, with each fee rounded down and the TOTAL fee the sum of the fees")
	}

	check.Equal(report(map[string]Takings{"tacos": {Sales: 4, Cash: 1999}}, 0), []string{
		"stall      sales      cash      card     total      fee",
		"tacos          4     19.99      0.00     19.99     0.00",
		"TOTAL          4     19.99      0.00     19.99     0.00",
	}, "the report with a fee of 0 percent")
	check.Equal(report(map[string]Takings{"churros": {Sales: 3, Cash: 333, Card: 400}}, 50), []string{
		"stall      sales      cash      card     total      fee",
		"churros        3      3.33      4.00      7.33     3.66",
		"TOTAL          3      3.33      4.00      7.33     3.66",
	}, "the report with a fee of 50 percent")
	check.Equal(report(map[string]Takings{}, 10), []string{
		"stall      sales      cash      card     total      fee",
		"TOTAL          0      0.00      0.00      0.00     0.00",
	}, "the report of no stalls")
}
