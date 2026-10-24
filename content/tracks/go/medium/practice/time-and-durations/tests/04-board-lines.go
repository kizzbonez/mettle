import "time"

func Test(t *testing.T) {
	oslo, err := time.LoadLocation("Europe/Oslo")
	if err != nil {
		t.Fatalf("loading the Europe/Oslo time zone: %v", err)
	}
	minus5 := time.FixedZone("UTC-5", -5*60*60)

	s := Session{Name: "pursuit", Start: time.Date(2027, time.March, 1, 9, 5, 0, 0, time.UTC), Length: 50 * time.Minute}
	check.Equal(s.BoardLine(time.UTC), "Mon 1 Mar 09:05-09:55 pursuit", "a board line in UTC with a one-digit day")
	check.Equal(s.BoardLine(oslo), "Mon 1 Mar 10:05-10:55 pursuit", "the same session in Oslo in winter")
	check.Equal(s.BoardLine(minus5), "Mon 1 Mar 04:05-04:55 pursuit", "the same session in a zone behind UTC")

	late := Session{Name: "midnight", Start: time.Date(2026, time.December, 31, 23, 30, 0, 0, oslo), Length: 90 * time.Minute}
	check.Equal(late.BoardLine(oslo), "Thu 31 Dec 23:30-01:00 midnight", "a session that ends after midnight")

	// Oslo's clocks go back from 03:00 to 02:00 on 25 October 2026, so this
	// two-hour session ends at 02:30 on the clock.
	night, err := parseSession("2026-10-25 01:30 120 night", oslo)
	check.NoError(err, "parseSession of a session on the night the clocks change")
	check.Equal(night.BoardLine(oslo), "Sun 25 Oct 01:30-02:30 night", "a two-hour session across the clock change")
	check.Equal(night.BoardLine(time.UTC), "Sat 24 Oct 23:30-01:30 night", "the same session in UTC")

	summer, err := parseSession("2026-07-04 12:00 30 summer", oslo)
	check.NoError(err, "parseSession of a summer session")
	check.Equal(summer.BoardLine(time.UTC), "Sat 4 Jul 10:00-10:30 summer", "a summer session in Oslo is two hours ahead of UTC")
}
