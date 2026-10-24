import "strings"

func Test(t *testing.T) {
	day := "06:00 20\n07:00 150\n08:00 500\n09:00 150\n"

	plain := check.RunScript(day)
	check.Equal(plain.Out, "total: 820\nbusiest: 08:00 (500)\n", "the summary without the -busy flag")
	check.Equal(plain.Code, 0, "the exit code for a clean file")
	check.Equal(plain.Err, "", "nothing on standard error for a clean file")

	busy := check.RunScript(day, "-busy", "150")
	check.Equal(busy.Out, "total: 820\nbusiest: 08:00 (500)\nhours with 150 or more: 07:00 08:00 09:00\n",
		"the summary with -busy 150, which includes hours with exactly 150")
	equals := check.RunScript(day, "-busy=600")
	check.Equal(equals.Out, "total: 820\nbusiest: 08:00 (500)\nhours with 600 or more: none\n",
		"the summary with -busy=600, which no hour reaches")

	negative := check.RunScript(day, "-busy", "-5")
	check.Equal(negative.Code, 2, "the exit code for a negative -busy")
	check.Equal(negative.Err, "-busy must not be negative\n", "the message for a negative -busy")
	check.Equal(negative.Out, "", "nothing on standard output for a negative -busy")

	wrong := check.RunScript(day, "-busy", "lots")
	check.Equal(wrong.Code, 2, "the exit code for a -busy value that is not a number")
	check.True(strings.Contains(wrong.Err, "-busy"), "the flag package explains a -busy value that is not a number")
	check.Equal(wrong.Out, "", "nothing on standard output for a bad -busy value")
}
