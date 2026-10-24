import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
)

func Test(t *testing.T) {
	dir := t.TempDir()
	in := filepath.Join(dir, "week-29.txt")
	book := "# week 29\nChile\nPeru\nChile\n"
	check.NoError(os.WriteFile(in, []byte(book), 0o644), "writing a visitor book for the test")

	nested := filepath.Join(dir, "reports", "2026", "july", "week-29.txt")
	check.NoError(summarise(in, nested), "summarise into folders that do not exist yet")
	saved, err := os.ReadFile(nested)
	check.NoError(err, "reading back the summary in the new folders")
	check.Equal(string(saved), "Chile 2\nPeru 1\n", "the summary saved in the new folders")

	again, err := os.ReadFile(in)
	check.NoError(err, "reading the visitor book again")
	check.Equal(string(again), book, "the visitor book itself is not changed")

	old := filepath.Join(dir, "old.txt")
	check.NoError(os.WriteFile(old, []byte("an old summary that is much longer than the new one\n"), 0o644), "writing an old summary")
	check.NoError(summarise(in, old), "summarise over an existing file")
	saved, err = os.ReadFile(old)
	check.NoError(err, "reading back the replaced summary")
	check.Equal(string(saved), "Chile 2\nPeru 1\n", "an existing output file is replaced, not added to")

	err = summarise(filepath.Join(dir, "nobody-wrote-this.txt"), filepath.Join(dir, "never", "out.txt"))
	check.True(errors.Is(err, fs.ErrNotExist), "a missing visitor book gives an error that is fs.ErrNotExist")
	_, statErr := os.Stat(filepath.Join(dir, "never"))
	check.True(errors.Is(statErr, fs.ErrNotExist), "nothing is created when the visitor book is missing")

	check.Error(summarise(in, dir), "summarise to a path that is a folder returns an error")
}
