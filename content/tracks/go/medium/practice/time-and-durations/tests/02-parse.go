import (
	"errors"
	"time"
)

func Test(t *testing.T) {
	plus3 := time.FixedZone("UTC+3", 3*60*60)

	s, err := parseSession("2027-01-02 07:05 45 lessons", plus3)
	check.NoError(err, "parseSession of a morning line")
	check.True(s.Start.Equal(time.Date(2027, time.January, 2, 4, 5, 0, 0, time.UTC)), "the start is local time in the zone passed in")
	check.Equal(s.Length, 45*time.Minute, "the length in minutes becomes a time.Duration")
	check.Equal(s.Name, "lessons", "the name is the fourth field")

	s, err = parseSession("  2027-01-02   23:59  600   sprint ", time.UTC)
	check.NoError(err, "parseSession with extra spaces between and around the fields")
	check.True(s.End().Equal(time.Date(2027, time.January, 3, 9, 59, 0, 0, time.UTC)), "a ten-hour session ends the next day")
	check.Equal(s.Length, 10*time.Hour, "a length of 600 minutes")

	var parseErr *time.ParseError
	_, err = parseSession("19/12/2026 18:30 90 taster", plus3)
	check.True(errors.As(err, &parseErr), "a date in the wrong layout returns an error that wraps the *time.ParseError")
	_, err = parseSession("2026-12-19 6.30pm 90 taster", plus3)
	check.True(errors.As(err, &parseErr), "a time of day in the wrong layout wraps the *time.ParseError")
	_, err = parseSession("2026-02-30 18:30 90 taster", plus3)
	check.Error(err, "a date that does not exist is rejected")
	_, err = parseSession("2026-12-19 25:00 90 taster", plus3)
	check.Error(err, "an hour that does not exist is rejected")

	for _, bad := range []string{"0", "-30", "1.5", "abc"} {
		s, err := parseSession("2026-12-19 18:30 "+bad+" taster", plus3)
		check.Error(err, "a length that is not a whole number of minutes above 0 is rejected")
		check.True(s.Start.IsZero() && s.Name == "", "the zero Session is returned with an error")
	}
	for _, bad := range []string{"", "2026-12-19 18:30 90", "2026-12-19 18:30 90 family ride"} {
		_, err := parseSession(bad, plus3)
		check.Error(err, "a line without exactly four fields is rejected")
	}
}
