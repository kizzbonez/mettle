import (
	"errors"
	"io"
	"strings"
	"time"
)

var errCableOut = errors.New("the network cable came out")

// halfSheet gives some text and then fails instead of reaching the end.
type halfSheet struct {
	text io.Reader
}

func (h *halfSheet) Read(p []byte) (int, error) {
	n, err := h.text.Read(p)
	if err == io.EOF {
		return n, errCableOut
	}
	return n, err
}

// lineErrorsOf returns the *LineError values joined in err, in order.
func lineErrorsOf(err error) []*LineError {
	joined, ok := err.(interface{ Unwrap() []error })
	if !ok {
		return nil
	}
	var out []*LineError
	for _, e := range joined.Unwrap() {
		if le, ok := e.(*LineError); ok {
			out = append(out, le)
		}
	}
	return out
}

func Test(t *testing.T) {
	le := &LineError{Line: 12, Err: ErrNoMember}
	check.Equal(le.Error(), "line 12: no member name", "the text of a *LineError")
	check.True(errors.Is(le, ErrNoMember), "a *LineError unwraps to its Err")
	check.True(le.Unwrap() == ErrNoMember, "Unwrap returns Err")

	clean := "member,date,time\r\nKai,2026-11-01,6:45.2\r\n  lu , 2026-11-02 , 7:01.0 \r\n"
	results, err := ReadResults(strings.NewReader(clean))
	check.NoError(err, "ReadResults of a clean sheet with Windows line endings and spaces")
	check.Equal(results, []Result{
		{Member: "Kai", Date: time.Date(2026, time.November, 1, 0, 0, 0, 0, time.UTC), Time: ErgTime(6*time.Minute + 45*time.Second + 200*time.Millisecond)},
		{Member: "lu", Date: time.Date(2026, time.November, 2, 0, 0, 0, 0, time.UTC), Time: ErgTime(7*time.Minute + time.Second)},
	}, "the results of a clean sheet, with spaces removed and names kept as written")

	messy := strings.Join([]string{
		"member,date,time",
		"",
		"ada,2026-11-01,7:00.0",
		"bo,2026-11-01",
		"",
		"cy,2026-13-01,7:10.0",
		"dee,2026-11-01,7:10.0,extra",
		`"Smith, Jo",2026-11-02,7:20.0`,
		"   ,2026-11-02,7:20.0",
		"eli,2026-11-02,7:2O.0",
		"fay,01/11/2026,7:20.0",
		"gus,2026-11-03,6:59.9",
	}, "\n") + "\n"
	results, err = ReadResults(strings.NewReader(messy))
	check.Equal(len(results), 3, "the number of valid results in a messy sheet")
	if len(results) == 3 {
		check.Equal([]string{results[0].Member, results[1].Member, results[2].Member}, []string{"ada", "Smith, Jo", "gus"}, "the valid results are kept in file order, quoted names included")
	}
	check.Error(err, "ReadResults reports the bad lines of a messy sheet")
	lines := lineErrorsOf(err)
	var numbers []int
	for _, l := range lines {
		numbers = append(numbers, l.Line)
	}
	check.Equal(numbers, []int{4, 6, 7, 9, 10, 11}, "the line numbers of the bad lines, counting blank lines and the header")
	if len(lines) == 6 {
		check.True(errors.Is(lines[0], ErrFields), "a line with too few fields wraps ErrFields")
		check.True(errors.Is(lines[1], ErrBadDate), "a line with a date that does not exist wraps ErrBadDate")
		check.True(errors.Is(lines[2], ErrFields), "a line with too many fields wraps ErrFields")
		check.True(errors.Is(lines[3], ErrNoMember), "a line with only spaces for a name wraps ErrNoMember")
		check.True(errors.Is(lines[4], ErrBadTime), "a line with a badly written time wraps ErrBadTime")
		check.True(errors.Is(lines[5], ErrBadDate), "a line with a date in another layout wraps ErrBadDate")
		check.Equal(lines[1].Error(), `line 6: bad date "2026-13-01"`, "the text of the error for a bad date")
		check.Equal(lines[4].Error(), `line 10: bad erg time "7:2O.0"`, "the text of the error for a bad time")
	}

	order, err := ReadResults(strings.NewReader("member,date,time\n,2026-13-01,bad\nzed,2026-13-01,bad\n"))
	check.Equal(len(order), 0, "no valid results when every line is bad")
	ordered := lineErrorsOf(err)
	if len(ordered) == 2 {
		check.True(errors.Is(ordered[0], ErrNoMember), "a missing name is reported before a bad date or time")
		check.True(errors.Is(ordered[1], ErrBadDate), "a bad date is reported before a bad time")
	} else {
		check.Fail("every bad line gives one *LineError, joined with errors.Join")
	}

	for _, header := range []string{"", "name,date,time\nada,2026-11-01,7:00.0\n", "ada,2026-11-01,7:00.0\n", "member,date\n"} {
		results, err := ReadResults(strings.NewReader(header))
		check.Equal(len(results), 0, "no results are returned when the header is wrong or missing")
		var headerErr *LineError
		check.True(errors.As(err, &headerErr) && headerErr.Line == 1 && errors.Is(err, ErrBadHeader), "a wrong or missing header gives a *LineError for line 1 that wraps ErrBadHeader")
	}

	results, err = ReadResults(strings.NewReader("member,date,time\n"))
	check.NoError(err, "a sheet with only the header is not an error")
	check.Equal(len(results), 0, "a sheet with only the header has no results")

	results, err = ReadResults(&halfSheet{text: strings.NewReader("member,date,time\nada,2026-11-01,7:00.0\nbo,2026-11-0")})
	check.True(errors.Is(err, errCableOut), "an error from the reader is returned, wrapped")
	check.Equal(len(results), 0, "no results are returned when the reader fails")

	results, err = ReadResults(strings.NewReader("member,date,time\nada,2026-11-01,7:00.0\nb\"o,2026-11-01,7:00.0\n"))
	check.Error(err, "a CSV syntax error stops reading")
	check.Equal(len(lineErrorsOf(err)), 0, "a CSV syntax error is not reported as a bad line")
	check.Equal(len(results), 0, "no results are returned after a CSV syntax error")
}
