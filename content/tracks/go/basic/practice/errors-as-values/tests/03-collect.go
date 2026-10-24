import "maps"

func Test(t *testing.T) {
	runners := map[int]string{5: "Cy", 61: "Dee", 702: "Eli"}
	collected := map[int]bool{61: true}

	name, err := collect(runners, collected, " 5")
	check.NoError(err, "collecting a bib nobody has collected yet")
	check.Equal(name, "Cy", "the name for a bib collected for the first time")
	check.Equal(collected, map[int]bool{5: true, 61: true}, "the collected bibs after one is handed out")

	before := maps.Clone(collected)
	name, err = collect(runners, collected, "#61")
	check.Equal(name, "", "the name returned with an error")
	check.ErrorIs(err, ErrCollected, "collecting a bib already collected wraps ErrCollected")
	check.Equal(err.Error(), "bib 61 for Dee: bib already collected", "the error for a bib already collected")
	check.True(err != ErrCollected, "ErrCollected is wrapped with context, not returned as it is")

	_, err = collect(runners, collected, "300")
	check.ErrorIs(err, ErrUnknownBib, "collecting a bib no runner has wraps ErrUnknownBib")
	check.Equal(err.Error(), "bib 300: no runner has this bib", "the error for a bib no runner has")
	check.True(err != ErrUnknownBib, "ErrUnknownBib is wrapped with context, not returned as it is")

	_, err = collect(runners, collected, "seven")
	check.Error(err, "collecting a bib that is not a number")
	check.Equal(err.Error(), `bib "seven": strconv.Atoi: parsing "seven": invalid syntax`, "the error from parseBib is returned as it is")
	_, err = collect(runners, collected, "1500")
	check.Equal(err.Error(), "bib 1500 is not from 1 to 999", "the range error from parseBib is returned as it is")
	check.Equal(collected, before, "failed collections change nothing")

	name, err = collect(runners, collected, "702")
	check.NoError(err, "collecting another runner's bib after some failures")
	check.Equal(name, "Eli", "the name for that bib")
	_, err = collect(runners, collected, "5")
	check.ErrorIs(err, ErrCollected, "collecting the first bib again")
}
