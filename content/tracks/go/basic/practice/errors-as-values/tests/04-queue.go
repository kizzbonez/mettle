func Test(t *testing.T) {
	runners := map[int]string{1: "Fay", 2: "Gus", 3: "Hal", 40: "Ivy"}
	collected := map[int]bool{3: true}
	queue := []string{"1", "#3", "2", "1", "x2", "41", "40", "", "#1000"}

	handed, problems := collectQueue(runners, collected, queue)
	check.Equal(handed, 3, "the number of bibs handed out")
	check.Equal(problems, []string{
		`5: bib "x2": strconv.Atoi: parsing "x2": invalid syntax`,
		"6: bib 41: no runner has this bib",
		`8: bib "": strconv.Atoi: parsing "": invalid syntax`,
		"9: bib 1000 is not from 1 to 999",
	}, "the problems, numbered by queue position, without the bibs already collected")
	check.Equal(collected, map[int]bool{1: true, 2: true, 3: true, 40: true}, "the collected bibs after the queue")

	handed, problems = collectQueue(runners, collected, []string{"1", "2", "40"})
	check.Equal(handed, 0, "a queue of runners who all have their bibs hands out nothing")
	check.Equal(len(problems), 0, "runners asking again for bibs they have are not problems")

	handed, problems = collectQueue(runners, map[int]bool{}, nil)
	check.Equal(handed, 0, "an empty queue hands out nothing")
	check.Equal(len(problems), 0, "an empty queue has no problems")
}
