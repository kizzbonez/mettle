import (
	"errors"
	"io"
	"strings"
)

var errReadingStopped = errors.New("the card reader was unplugged")

// stoppingReader gives its text and then fails instead of reaching the end.
type stoppingReader struct {
	text io.Reader
}

func (r *stoppingReader) Read(p []byte) (int, error) {
	n, err := r.text.Read(p)
	if err == io.EOF {
		return n, errReadingStopped
	}
	return n, err
}

func Test(t *testing.T) {
	counts, err := countCountries(strings.NewReader("Chile\nchile\n Chile \nPeru\n"))
	check.NoError(err, "countCountries on a plain list")
	check.Equal(counts, map[string]int{"Chile": 2, "chile": 1, "Peru": 1}, "countries keep their case and lose the spaces around them")

	counts, err = countCountries(strings.NewReader("# header\n\n   \n  # an indented comment\nPeru\n#Peru\n"))
	check.NoError(err, "countCountries with comments and blank lines")
	check.Equal(counts, map[string]int{"Peru": 1}, "blank lines and lines starting with # are skipped, even when indented")

	counts, err = countCountries(strings.NewReader("Wales\r\nJapan\r\nWales"))
	check.NoError(err, "countCountries with Windows line endings")
	check.Equal(counts, map[string]int{"Wales": 2, "Japan": 1}, "Windows line endings and a last line without a newline")

	counts, err = countCountries(strings.NewReader("Costa Rica\nNew Zealand\n"))
	check.NoError(err, "countCountries with spaces inside names")
	check.Equal(counts, map[string]int{"Costa Rica": 1, "New Zealand": 1}, "a country name may contain spaces")

	counts, err = countCountries(strings.NewReader(""))
	check.NoError(err, "countCountries on an empty book")
	check.Equal(len(counts), 0, "an empty book has no countries")

	_, err = countCountries(&stoppingReader{text: strings.NewReader("Wales\nJapan\n")})
	check.ErrorIs(err, errReadingStopped, "the error of a reader that fails is returned")
}
