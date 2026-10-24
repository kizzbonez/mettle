import "time"

func Test(t *testing.T) {
	oslo, err := time.LoadLocation("Europe/Oslo")
	if err != nil {
		t.Fatalf("loading the Europe/Oslo time zone: %v", err)
	}
	taster, err := parseSession("2026-12-19 18:30 90 taster", oslo)
	check.NoError(err, "parseSession of the taster line")
	check.Equal(taster.Name, "taster", "the taster's name")
	check.True(taster.Start.Equal(time.Date(2026, time.December, 19, 17, 30, 0, 0, time.UTC)), "the taster starts at 18:30 in Oslo, 17:30 UTC")
	check.Equal(taster.Length, 90*time.Minute, "the taster's length")
	check.True(taster.End().Equal(time.Date(2026, time.December, 19, 20, 0, 0, 0, oslo)), "the taster ends at 20:00 in Oslo")

	check.Equal(taster.BoardLine(oslo), "Sat 19 Dec 18:30-20:00 taster", "the taster's board line in Oslo")
	check.Equal(taster.BoardLine(time.UTC), "Sat 19 Dec 17:30-19:00 taster", "the taster's board line in UTC")

	now := time.Date(2026, time.December, 19, 17, 45, 30, 0, oslo)
	check.Equal(taster.Status(now), "starts in 44m0s", "the status 44 minutes and 30 seconds before the start")
	check.Equal(taster.Status(taster.Start), "on now, 1h30m0s left", "the status at the very start")
	check.Equal(taster.Status(taster.End()), "finished", "the status at the very end")

	_, err = parseSession("2026-12-19 18:30 ninety taster", oslo)
	check.Error(err, "parseSession of a line whose length is not a number")
}
