func Test(t *testing.T) {
	runners := map[int]string{417: "Ada", 23: "Bo"}
	collected := map[int]bool{}

	name, err := collect(runners, collected, "#417")
	check.NoError(err, `collect(runners, collected, "#417") returns no error`)
	check.Equal(name, "Ada", `collect(runners, collected, "#417") returns the runner's name`)
	check.Equal(collected[417], true, `collected[417] after collecting "#417"`)

	name, err = collect(runners, collected, "417")
	check.Equal(name, "", `the name returned when "417" is collected a second time`)
	check.Error(err, `collecting "417" a second time returns an error`)
	check.Equal(err.Error(), "bib 417 for Ada: bib already collected", `the error for collecting "417" a second time`)

	_, err = collect(runners, collected, "88")
	check.Error(err, `collecting "88" returns an error`)
	check.Equal(err.Error(), "bib 88: no runner has this bib", `the error for collecting "88"`)

	bib, err := parseBib("4l7")
	check.Equal(bib, 0, `the number parseBib("4l7") returns`)
	check.Error(err, `parseBib("4l7") returns an error`)
	check.Equal(err.Error(), `bib "4l7": strconv.Atoi: parsing "4l7": invalid syntax`, `the error from parseBib("4l7")`)

	handed, problems := collectQueue(runners, collected, []string{"23", "417", "abc", "0"})
	check.Equal(handed, 1, "the number of bibs handed out for the example queue")
	check.Equal(problems, []string{
		`3: bib "abc": strconv.Atoi: parsing "abc": invalid syntax`,
		"4: bib 0 is not from 1 to 999",
	}, "the problems for the example queue")
}
