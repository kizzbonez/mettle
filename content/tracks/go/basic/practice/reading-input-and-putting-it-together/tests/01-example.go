import "strings"

func Test(t *testing.T) {
	day := strings.Join([]string{
		"# Bridge Street, Monday",
		"07:00 134",
		"08:00 412",
		"09:00 4l2",
		"10:00 96",
		"",
		"11:00 301 bikes",
		"12:00 -3",
		"17:00 388",
	}, "\n") + "\n"

	ran := check.RunScript(day, "-busy", "300")
	check.Equal(ran.Out, "total: 1030\nbusiest: 08:00 (412)\nhours with 300 or more: 08:00 17:00\n",
		"the summary printed on standard output for the sample day with -busy 300")
	check.Equal(ran.Err, "line 4: count \"4l2\": strconv.Atoi: parsing \"4l2\": invalid syntax\n"+
		"line 7: expected 2 fields, found 3\n"+
		"line 8: count -3 is negative\n",
		"the rejected lines reported on standard error, numbered from the top of the file")
	check.Equal(ran.Code, 1, "the exit code when some lines were rejected")
}
