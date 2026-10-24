import (
	"bytes"
	"errors"
	"strings"
	"time"
)

// sampleSheet is the sample month from the instructions.
const sampleSheet = `member,date,time
ada,2026-10-03,7:12.4
bo,2026-10-03,6:58.0
ada,2026-10-17,7:05.9
cy,2026-10-17,7:5.2
bo,2026-10-17,6:58.0
dee,2026-10-31,7:40.1
,2026-10-31,7:01.0
ada,2026-10-31,6:58.0
`

func octoberDay(day int) time.Time {
	return time.Date(2026, time.October, day, 0, 0, 0, 0, time.UTC)
}

func Test(t *testing.T) {
	results, err := ReadResults(strings.NewReader(sampleSheet))
	check.Equal(len(results), 6, "the number of valid results in the sample month")
	check.Error(err, "ReadResults reports the bad lines of the sample month")
	if err == nil {
		return
	}
	check.Equal(err.Error(), "line 5: bad erg time \"7:5.2\"\nline 8: no member name", "the text of the error for the sample month")
	check.True(errors.Is(err, ErrBadTime), "errors.Is finds ErrBadTime in the sample month's error")
	check.True(errors.Is(err, ErrNoMember), "errors.Is finds ErrNoMember in the sample month's error")
	var lineErr *LineError
	check.True(errors.As(err, &lineErr), "errors.As finds a *LineError in the sample month's error")
	if lineErr != nil {
		check.Equal(lineErr.Line, 5, "the line of the first *LineError")
	}

	sixFiftyEight := ErgTime(6*time.Minute + 58*time.Second)
	want := []Entry{
		{Rank: 1, Member: "ada", Best: sixFiftyEight, Date: octoberDay(31), Attempts: 3},
		{Rank: 1, Member: "bo", Best: sixFiftyEight, Date: octoberDay(3), Attempts: 2},
		{Rank: 3, Member: "dee", Best: ErgTime(7*time.Minute + 40*time.Second + 100*time.Millisecond), Date: octoberDay(31), Attempts: 1},
	}
	entries := Standings(results)
	check.Equal(entries, want, "the standings of the sample month")

	var buf bytes.Buffer
	if len(entries) >= 2 {
		check.NoError(WriteJSON(&buf, entries[:2]), "WriteJSON of the first two entries")
		check.Equal(buf.String(), `[
  {
    "rank": 1,
    "member": "ada",
    "best": "6:58.0",
    "date": "2026-10-31T00:00:00Z",
    "attempts": 3
  },
  {
    "rank": 1,
    "member": "bo",
    "best": "6:58.0",
    "date": "2026-10-03T00:00:00Z",
    "attempts": 2
  }
]
`, "the JSON of the first two entries")
	}

	var days []int
	for r := range Attempts(results, "ada") {
		days = append(days, r.Date.Day())
	}
	check.Equal(days, []int{3, 17, 31}, "the days of Ada's attempts, in order")
}
