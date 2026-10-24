import "strings"

// The sample sheet from the instructions, run as a program with the default fee.
func Test(t *testing.T) {
	sheet := strings.Join([]string{
		"# Canal Street night market, Friday",
		"dumplings 4.50 cash",
		"Dumplings 12.00 card",
		"crepes 3.20 Cash",
		"crepes 3.20 card",
		"bao 6.75 card",
		"crepes 3,20 cash",
		"churros 2.50",
		"dumplings 4.50 cash",
		"bao 6.75 paypal",
		"crepes 0.80 card",
	}, "\n") + "\n"

	ran := check.RunScript(sheet)
	check.Equal(ran.Out, strings.Join([]string{
		"stall      sales      cash      card     total      fee",
		"bao            1      0.00      6.75      6.75     0.67",
		"crepes         3      3.20      4.00      7.20     0.72",
		"dumplings      3      9.00     12.00     21.00     2.10",
		"TOTAL          7     12.20     22.75     34.95     3.49",
	}, "\n")+"\n", "the report printed on standard output for the sample sheet")
	check.Equal(ran.Err, strings.Join([]string{
		`line 7: amount "3,20": not a valid amount`,
		"line 8: expected 3 fields, found 2",
		`line 10: payment "paypal": unknown payment method`,
		"3 lines rejected",
	}, "\n")+"\n", "the rejected lines and their count on standard error")
	check.Equal(ran.Code, 1, "the exit code when some lines were rejected")
}
