// Package ergboard keeps the rowing club's erg test results: it reads them
// from CSV, works out each member's standing and writes the leaderboard as
// JSON.
package ergboard

import (
	"errors"
	"io"
	"iter"
	"time"
)

// Errors a caller can test for with errors.Is. Keep their names and texts.
var (
	ErrBadHeader = errors.New("header must be member,date,time")
	ErrFields    = errors.New("want 3 fields")
	ErrNoMember  = errors.New("no member name")
	ErrBadDate   = errors.New("bad date")
	ErrBadTime   = errors.New("bad erg time")
)

// ErgTime is the time a member took to row 2,000 metres, to a tenth of a
// second. It is written as minutes, seconds and tenths: 7:12.4.
type ErgTime time.Duration

// Result is one erg test.
type Result struct {
	Member string
	Date   time.Time
	Time   ErgTime
}

// Entry is one line of the leaderboard. Task 4: add its JSON tags.
type Entry struct {
	Rank     int
	Member   string
	Best     ErgTime
	Date     time.Time
	Attempts int
}

// LineError reports a line of the CSV file that could not be read.
type LineError struct {
	Line int
	Err  error
}

// Task 2: Error returns "line <Line>: <Err>".
func (e *LineError) Error() string {
	panic("not implemented")
}

// Task 2: Unwrap returns Err, so that errors.Is and errors.As see it.
func (e *LineError) Unwrap() error {
	panic("not implemented")
}

// Task 1: ParseErgTime reads a time written as m:ss.t.
func ParseErgTime(s string) (ErgTime, error) {
	panic("not implemented")
}

// Task 1: String writes the time as m:ss.t.
func (t ErgTime) String() string {
	panic("not implemented")
}

// Task 1: MarshalJSON writes the time as a JSON string such as "7:12.4".
func (t ErgTime) MarshalJSON() ([]byte, error) {
	panic("not implemented")
}

// Task 2: ReadResults reads results from CSV with the header member,date,time.
func ReadResults(r io.Reader) ([]Result, error) {
	panic("not implemented")
}

// Task 3: BestBy groups items by key and keeps the best item of each group.
func BestBy[K comparable, V any](items []V, key func(V) K, better func(a, b V) bool) map[K]V {
	panic("not implemented")
}

// Task 3: Standings returns one leaderboard entry per member, in order.
func Standings(results []Result) []Entry {
	panic("not implemented")
}

// Task 3: Attempts yields one member's results, earliest day first.
func Attempts(results []Result, member string) iter.Seq[Result] {
	panic("not implemented")
}

// Task 4: WriteJSON writes the entries to w as indented JSON.
func WriteJSON(w io.Writer, entries []Entry) error {
	panic("not implemented")
}
