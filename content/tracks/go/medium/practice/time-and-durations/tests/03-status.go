import "time"

func Test(t *testing.T) {
	start := time.Date(2026, time.December, 20, 10, 0, 0, 0, time.UTC)
	s := Session{Name: "sprint", Start: start, Length: 65 * time.Minute}

	check.True(s.End().Equal(start.Add(65*time.Minute)), "End is Length after Start")

	check.Equal(s.Status(start.Add(-2*time.Hour-30*time.Second)), "starts in 2h0m0s", "the status two hours and a few seconds before")
	check.Equal(s.Status(start.Add(-59*time.Second)), "starts in 0s", "the status less than a minute before the start")
	check.Equal(s.Status(start.Add(-time.Nanosecond)), "starts in 0s", "the status a nanosecond before the start")
	check.Equal(s.Status(start), "on now, 1h5m0s left", "the status at the start")
	check.Equal(s.Status(start.Add(5*time.Minute+1*time.Second)), "on now, 59m0s left", "the status just after five minutes in, rounded down")
	check.Equal(s.Status(s.End().Add(-time.Second)), "on now, 0s left", "the status a second before the end")
	check.Equal(s.Status(s.End()), "finished", "the status at the end")
	check.Equal(s.Status(s.End().Add(24*time.Hour)), "finished", "the status a day later")

	tokyo := time.FixedZone("UTC+9", 9*60*60)
	check.Equal(s.Status(start.In(tokyo)), "on now, 1h5m0s left", "the start given in another zone is still the start")
	check.Equal(s.Status(s.End().In(tokyo)), "finished", "the end given in another zone is still the end")
	check.Equal(s.Status(time.Date(2026, time.December, 20, 18, 30, 0, 0, tokyo)), "starts in 30m0s", "a moment written in another zone")
}
