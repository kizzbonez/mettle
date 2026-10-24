import (
	"bytes"
	"errors"
)

var errDiskFull = errors.New("disk full")

// fullDisk accepts a number of writes and then fails every write after that.
type fullDisk struct {
	room     int
	attempts int
	written  bytes.Buffer
}

func (d *fullDisk) Write(p []byte) (int, error) {
	d.attempts++
	if d.attempts > d.room {
		return 0, errDiskFull
	}
	return d.written.Write(p)
}

func Test(t *testing.T) {
	var buf bytes.Buffer
	err := writeSummary(&buf, map[string]int{"Peru": 1, "Chile": 4, "Wales": 4, "Japan": 2, "Austria": 1})
	check.NoError(err, "writeSummary to a buffer")
	check.Equal(buf.String(), "Chile 4\nWales 4\nJapan 2\nAustria 1\nPeru 1\n", "the summary is sorted by count, highest first, then by name")

	buf.Reset()
	check.NoError(writeSummary(&buf, map[string]int{}), "writeSummary of an empty map")
	check.Equal(buf.String(), "", "an empty map writes nothing")

	buf.Reset()
	check.NoError(writeSummary(&buf, map[string]int{"New Zealand": 12}), "writeSummary of one country")
	check.Equal(buf.String(), "New Zealand 12\n", "one line for a single country with a two-digit count")

	disk := &fullDisk{room: 1}
	err = writeSummary(disk, map[string]int{"Chile": 3, "Peru": 2, "Japan": 1})
	check.ErrorIs(err, errDiskFull, "the error of a write that fails is returned")
	check.Equal(disk.written.String(), "Chile 3\n", "the lines written before the failure")
	check.Equal(disk.attempts, 2, "no more writes are tried after the first write that fails")
}
