import "strings"

// The program run with flags and arguments, and on sheets that are clean, empty, written on
// Windows, or entirely wrong.
func Test(t *testing.T) {
	sheet := "tacos 10.00 cash\nfalafel 5.55 card\n"
	header := "stall      sales      cash      card     total      fee\n"

	clean := check.RunScript(sheet)
	check.Equal(clean.Out, header+
		"falafel        1      0.00      5.55      5.55     0.55\n"+
		"tacos          1     10.00      0.00     10.00     1.00\n"+
		"TOTAL          2     10.00      5.55     15.55     1.55\n",
		"the report for a clean sheet with the default fee")
	check.Equal(clean.Err, "", "nothing on standard error for a clean sheet")
	check.Equal(clean.Code, 0, "the exit code for a clean sheet")

	quarter := check.RunScript(sheet, "-fee=25")
	check.True(strings.HasSuffix(quarter.Out, "TOTAL          2     10.00      5.55     15.55     3.88\n"),
		"the TOTAL row with -fee=25")
	none := check.RunScript(sheet, "-fee", "0")
	check.True(strings.HasSuffix(none.Out, "TOTAL          2     10.00      5.55     15.55     0.00\n"),
		"the TOTAL row with -fee 0")

	for _, fee := range []string{"51", "-1", "100"} {
		ran := check.RunScript(sheet, "-fee", fee)
		check.Equal(ran.Code, 2, "the exit code for a -fee outside 0 to 50")
		check.Equal(ran.Err, "night market: -fee must be from 0 to 50\n", "the message for a -fee outside 0 to 50")
		check.Equal(ran.Out, "", "nothing on standard output for a -fee outside 0 to 50")
	}
	notNumber := check.RunScript(sheet, "-fee", "ten")
	check.Equal(notNumber.Code, 2, "the exit code for a -fee that is not a number")
	check.Equal(notNumber.Out, "", "nothing on standard output for a -fee that is not a number")

	extra := check.RunScript(sheet, "notes.txt", "more.txt")
	check.Equal(extra.Code, 2, "the exit code for an argument left after the flags")
	check.Equal(extra.Err, "night market: unexpected argument \"notes.txt\"\n", "the message for an argument left after the flags")
	check.Equal(extra.Out, "", "nothing on standard output for an argument left after the flags")

	empty := check.RunScript("")
	check.Equal(empty.Out, "no sales\n", "the output for an empty sheet")
	check.Equal(empty.Err, "", "nothing on standard error for an empty sheet")
	check.Equal(empty.Code, 0, "the exit code for an empty sheet")

	windows := check.RunScript("# Saturday\r\n\r\n  tacos 2.00 CASH  \r\n   # stall 2\r\ntacos 2,00 cash\r\ntacos 3.00 card\r\n")
	check.Equal(windows.Out, header+
		"tacos          2      2.00      3.00      5.00     0.50\n"+
		"TOTAL          2      2.00      3.00      5.00     0.50\n",
		"the report for a sheet with Windows line endings, comments and blank lines")
	check.Equal(windows.Err, "line 5: amount \"2,00\": not a valid amount\n1 line rejected\n",
		"one rejected line, numbered counting blank and comment lines")
	check.Equal(windows.Code, 1, "the exit code for a sheet with one rejected line")

	wrong := check.RunScript("tacos\nbao 1.00 voucher\n")
	check.Equal(wrong.Out, "no sales\n", "the output when every line is rejected")
	check.Equal(wrong.Err, "line 1: expected 3 fields, found 1\n"+
		"line 2: payment \"voucher\": unknown payment method\n2 lines rejected\n",
		"the rejected lines and their count when every line is rejected")
	check.Equal(wrong.Code, 1, "the exit code when every line is rejected")

	last := check.RunScript("gelato 1.50 card")
	check.True(strings.HasPrefix(last.Out, header+"gelato         1      0.00      1.50      1.50     0.15\n"),
		"a sheet whose last line has no line break")
}
