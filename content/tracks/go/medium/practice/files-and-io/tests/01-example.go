import (
	"bytes"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
)

func Test(t *testing.T) {
	book, err := os.Open("data/visitors.txt")
	check.NoError(err, "opening data/visitors.txt")
	defer book.Close()
	counts, err := countCountries(book)
	check.NoError(err, "countCountries on data/visitors.txt")
	check.Equal(counts, map[string]int{"Wales": 3, "Japan": 2, "Portugal": 2, "New Zealand": 1}, "the countries counted in data/visitors.txt")

	var buf bytes.Buffer
	check.NoError(writeSummary(&buf, counts), "writeSummary to a bytes.Buffer")
	check.Equal(buf.String(), "Wales 3\nJapan 2\nPortugal 2\nNew Zealand 1\n", "the summary written for data/visitors.txt")

	reports := filepath.Join(t.TempDir(), "reports")
	out := filepath.Join(reports, "week-28.txt")
	check.NoError(summarise("data/visitors.txt", out), "summarise data/visitors.txt into reports/week-28.txt")
	saved, err := os.ReadFile(out)
	check.NoError(err, "reading back reports/week-28.txt")
	check.Equal(string(saved), "Wales 3\nJapan 2\nPortugal 2\nNew Zealand 1\n", "the contents of reports/week-28.txt")

	missingOut := filepath.Join(reports, "missing.txt")
	err = summarise("data/missing.txt", missingOut)
	check.True(errors.Is(err, fs.ErrNotExist), "summarise of a missing visitor book returns an error that is fs.ErrNotExist")
	_, statErr := os.Stat(missingOut)
	check.True(errors.Is(statErr, fs.ErrNotExist), "no output file is created when the visitor book is missing")
}
