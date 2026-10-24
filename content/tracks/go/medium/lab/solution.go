// Package ergboard keeps the rowing club's erg test results: it reads them
// from CSV, works out each member's standing and writes the leaderboard as
// JSON.
package ergboard

import (
	"cmp"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"iter"
	"slices"
	"strconv"
	"strings"
	"time"
)

// Errors a caller can test for with errors.Is.
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

// Entry is one line of the leaderboard.
type Entry struct {
	Rank     int       `json:"rank"`
	Member   string    `json:"member"`
	Best     ErgTime   `json:"best"`
	Date     time.Time `json:"date"`
	Attempts int       `json:"attempts"`
}

// LineError reports a line of the CSV file that could not be read.
type LineError struct {
	Line int
	Err  error
}

func (e *LineError) Error() string {
	return fmt.Sprintf("line %d: %v", e.Line, e.Err)
}

func (e *LineError) Unwrap() error {
	return e.Err
}

// ParseErgTime reads a time written as m:ss.t: one or more digits of
// minutes, exactly two digits of seconds from 00 to 59 and one digit of
// tenths.
func ParseErgTime(s string) (ErgTime, error) {
	bad := fmt.Errorf("%w %q", ErrBadTime, s)
	minText, rest, ok := strings.Cut(s, ":")
	if !ok {
		return 0, bad
	}
	secText, tenthText, ok := strings.Cut(rest, ".")
	if !ok || !allDigits(minText) || len(secText) != 2 || !allDigits(secText) || len(tenthText) != 1 || !allDigits(tenthText) {
		return 0, bad
	}
	minutes, err := strconv.Atoi(minText)
	if err != nil {
		return 0, bad
	}
	seconds, _ := strconv.Atoi(secText) // two digits, already checked
	tenths, _ := strconv.Atoi(tenthText)
	if seconds > 59 {
		return 0, bad
	}
	d := time.Duration(minutes)*time.Minute + time.Duration(seconds)*time.Second + time.Duration(tenths)*100*time.Millisecond
	return ErgTime(d), nil
}

// allDigits reports whether s is one or more ASCII digits.
func allDigits(s string) bool {
	if s == "" {
		return false
	}
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

// String writes the time as m:ss.t, dropping anything below a tenth.
func (t ErgTime) String() string {
	d := time.Duration(t)
	minutes := d / time.Minute
	seconds := (d % time.Minute) / time.Second
	tenths := (d % time.Second) / (100 * time.Millisecond)
	return fmt.Sprintf("%d:%02d.%d", minutes, seconds, tenths)
}

// MarshalJSON writes the time as a JSON string such as "7:12.4".
func (t ErgTime) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.String())
}

// ReadResults reads results from CSV with the header member,date,time. It
// returns every valid result, and, when some lines are bad, an error that
// joins one *LineError per bad line, in line order. An error from the CSV
// reader itself stops reading.
func ReadResults(r io.Reader) ([]Result, error) {
	cr := csv.NewReader(r)
	cr.FieldsPerRecord = -1
	header, err := cr.Read()
	if errors.Is(err, io.EOF) || (err == nil && !slices.Equal(header, []string{"member", "date", "time"})) {
		return nil, &LineError{Line: 1, Err: ErrBadHeader}
	}
	if err != nil {
		return nil, fmt.Errorf("reading results: %w", err)
	}

	var results []Result
	var bad []error
	for {
		record, err := cr.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("reading results: %w", err)
		}
		line, _ := cr.FieldPos(0)
		result, err := parseRecord(record)
		if err != nil {
			bad = append(bad, &LineError{Line: line, Err: err})
			continue
		}
		results = append(results, result)
	}
	return results, errors.Join(bad...)
}

// parseRecord turns one CSV record into a Result.
func parseRecord(record []string) (Result, error) {
	if len(record) != 3 {
		return Result{}, ErrFields
	}
	member := strings.TrimSpace(record[0])
	if member == "" {
		return Result{}, ErrNoMember
	}
	dateText := strings.TrimSpace(record[1])
	date, err := time.Parse(time.DateOnly, dateText)
	if err != nil {
		return Result{}, fmt.Errorf("%w %q", ErrBadDate, dateText)
	}
	t, err := ParseErgTime(strings.TrimSpace(record[2]))
	if err != nil {
		return Result{}, err
	}
	return Result{Member: member, Date: date, Time: t}, nil
}

// BestBy groups items by key and keeps the best item of each group: an
// item replaces the one kept so far only when better(item, kept) is true,
// so among equally good items the first one stays.
func BestBy[K comparable, V any](items []V, key func(V) K, better func(a, b V) bool) map[K]V {
	best := make(map[K]V)
	for _, item := range items {
		k := key(item)
		if kept, ok := best[k]; !ok || better(item, kept) {
			best[k] = item
		}
	}
	return best
}

// faster reports whether a is a better result than b: a lower time, or the
// same time rowed on an earlier day.
func faster(a, b Result) bool {
	if a.Time != b.Time {
		return a.Time < b.Time
	}
	return a.Date.Before(b.Date)
}

// Standings returns one entry per member: their best result, the day they
// rowed it and how many results they have. Entries are sorted by best time,
// then by name; members with the same best time share a rank, and the next
// rank skips the shared places (1, 1, 3).
func Standings(results []Result) []Entry {
	attempts := make(map[string]int)
	for _, r := range results {
		attempts[r.Member]++
	}
	best := BestBy(results, func(r Result) string { return r.Member }, faster)

	entries := make([]Entry, 0, len(best))
	for member, r := range best {
		entries = append(entries, Entry{Member: member, Best: r.Time, Date: r.Date, Attempts: attempts[member]})
	}
	slices.SortFunc(entries, func(a, b Entry) int {
		return cmp.Or(cmp.Compare(a.Best, b.Best), strings.Compare(a.Member, b.Member))
	})
	for i := range entries {
		if i > 0 && entries[i].Best == entries[i-1].Best {
			entries[i].Rank = entries[i-1].Rank
		} else {
			entries[i].Rank = i + 1
		}
	}
	return entries
}

// Attempts yields the member's results, earliest day first; results on the
// same day keep their order. It does not change results.
func Attempts(results []Result, member string) iter.Seq[Result] {
	return func(yield func(Result) bool) {
		var mine []Result
		for _, r := range results {
			if r.Member == member {
				mine = append(mine, r)
			}
		}
		slices.SortStableFunc(mine, func(a, b Result) int { return a.Date.Compare(b.Date) })
		for _, r := range mine {
			if !yield(r) {
				return
			}
		}
	}
}

// WriteJSON writes the entries to w as a JSON array indented with two
// spaces and followed by a newline. No entries at all is written as [].
func WriteJSON(w io.Writer, entries []Entry) error {
	if entries == nil {
		entries = []Entry{}
	}
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(entries)
}
