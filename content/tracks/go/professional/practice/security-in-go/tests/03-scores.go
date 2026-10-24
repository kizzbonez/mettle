import (
	"bytes"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
)

func Test(t *testing.T) {
	base := t.TempDir()
	dir := filepath.Join(base, "scores")
	check.NoError(os.Mkdir(dir, 0o755), "making the scores folder")
	check.NoError(os.Mkdir(filepath.Join(dir, "christmas"), 0o755), "making a subfolder")
	write := func(path string, data []byte) {
		check.NoError(os.WriteFile(path, data, 0o644), "writing a test file")
	}
	write(filepath.Join(dir, "march.pdf"), []byte("%PDF march"))
	write(filepath.Join(dir, "christmas", "carols.pdf"), []byte("%PDF carols"))
	write(filepath.Join(base, "secret.pdf"), []byte("committee minutes"))
	write(filepath.Join(dir, "notes.txt"), []byte("not a score"))
	check.NoError(os.Symlink("march.pdf", filepath.Join(dir, "latest.pdf")), "making a link inside the folder")
	check.NoError(os.Symlink("../secret.pdf", filepath.Join(dir, "sneaky.pdf")), "making a relative link out of the folder")
	check.NoError(os.Symlink(filepath.Join(base, "secret.pdf"), filepath.Join(dir, "absolute.pdf")), "making an absolute link")

	data, err := readScore(dir, "christmas/carols.pdf")
	check.NoError(err, "readScore of a file in a subfolder")
	check.Equal(string(data), "%PDF carols", "the contents of a file in a subfolder")
	data, err = readScore(dir, "latest.pdf")
	check.NoError(err, "readScore through a link that stays inside the folder")
	check.Equal(string(data), "%PDF march", "the contents read through a link inside the folder")
	data, err = readScore(dir, "christmas/../march.pdf")
	check.NoError(err, "readScore of a name with .. that stays inside the folder")
	check.Equal(string(data), "%PDF march", "the contents of a name with .. that stays inside the folder")

	for _, name := range []string{"../secret.pdf", "christmas/../../secret.pdf", filepath.Join(base, "secret.pdf"), "sneaky.pdf", "absolute.pdf"} {
		data, err := readScore(dir, name)
		check.Error(err, "readScore refuses a name that reaches a file outside the folder")
		check.True(!bytes.Contains(data, []byte("committee")), "readScore returns nothing from outside the folder")
	}

	_, err = readScore(dir, "notes.txt")
	check.ErrorIs(err, ErrNotScore, "readScore of a file that does not end in .pdf")
	_, err = readScore(dir, "../../../../etc/passwd")
	check.ErrorIs(err, ErrNotScore, "readScore checks the .pdf ending before opening anything")
	_, err = readScore(dir, "missing.pdf")
	check.ErrorIs(err, fs.ErrNotExist, "readScore of a score that does not exist")

	write(filepath.Join(dir, "full.pdf"), bytes.Repeat([]byte("x"), maxScoreBytes))
	data, err = readScore(dir, "full.pdf")
	check.NoError(err, "readScore of a file of exactly maxScoreBytes")
	check.Equal(len(data), maxScoreBytes, "the length of a file of exactly maxScoreBytes")
	write(filepath.Join(dir, "huge.pdf"), bytes.Repeat([]byte("x"), maxScoreBytes+1))
	data, err = readScore(dir, "huge.pdf")
	check.ErrorIs(err, ErrTooLarge, "readScore of a file one byte over maxScoreBytes")
	check.True(data == nil, "readScore returns no data with ErrTooLarge")
	check.True(!errors.Is(err, ErrNotScore), "a large score is not reported as not a score")
}
