func Test(t *testing.T) {
	empty := check.RunScript("")
	check.Equal(empty.Out, "no readings\n", "the output for an empty file")
	check.Equal(empty.Code, 0, "the exit code for an empty file")

	comments := check.RunScript("# counter restarted\n\n   \n  # nothing yet\n")
	check.Equal(comments.Out, "no readings\n", "the output for a file of comments and blank lines")
	check.Equal(comments.Err, "", "comments and blank lines are not errors")
	check.Equal(comments.Code, 0, "the exit code for a file of comments and blank lines")

	windows := check.RunScript("# Tuesday\r\n\r\n07:00 40\r\n08:00 x\r\n09:00 60\r\n")
	check.Equal(windows.Out, "total: 100\nbusiest: 09:00 (60)\n", "the summary for a file with Windows line endings")
	check.Equal(windows.Err, "line 4: count \"x\": strconv.Atoi: parsing \"x\": invalid syntax\n",
		"the rejected line of a file with Windows line endings, counting blank and comment lines")
	check.Equal(windows.Code, 1, "the exit code for a file with a rejected line")

	garbled := check.RunScript("07:00\n?? ?? ??\n")
	check.Equal(garbled.Out, "no readings\n", "the output when every line is rejected")
	check.Equal(garbled.Err, "line 1: expected 2 fields, found 1\nline 2: expected 2 fields, found 3\n",
		"the rejected lines when every line is rejected")
	check.Equal(garbled.Code, 1, "the exit code when every line is rejected")

	last := check.RunScript("  18:00   75  ")
	check.Equal(last.Out, "total: 75\nbusiest: 18:00 (75)\n", "a file whose only line has spaces around it and no line break")
	check.Equal(last.Code, 0, "the exit code for that file")
}
