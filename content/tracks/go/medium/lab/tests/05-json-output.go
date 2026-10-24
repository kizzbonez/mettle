import (
	"bytes"
	"encoding/json"
	"errors"
	"time"
)

var errBoardFull = errors.New("the website's disk is full")

// fullWebsite refuses every write.
type fullWebsite struct{}

func (fullWebsite) Write(p []byte) (int, error) { return 0, errBoardFull }

func Test(t *testing.T) {
	one := Entry{Rank: 1, Member: "Smith, Jo", Best: ErgTime(6*time.Minute + 5*time.Second + 300*time.Millisecond), Date: time.Date(2026, time.December, 5, 0, 0, 0, 0, time.UTC), Attempts: 4}
	data, err := json.Marshal(one)
	check.NoError(err, "json.Marshal of an Entry")
	check.Equal(string(data), `{"rank":1,"member":"Smith, Jo","best":"6:05.3","date":"2026-12-05T00:00:00Z","attempts":4}`, "an Entry marshals with lower-case names, in order, and its best time as a string")

	var buf bytes.Buffer
	check.NoError(WriteJSON(&buf, []Entry{one}), "WriteJSON of one entry")
	check.Equal(buf.String(), "[\n  {\n    \"rank\": 1,\n    \"member\": \"Smith, Jo\",\n    \"best\": \"6:05.3\",\n    \"date\": \"2026-12-05T00:00:00Z\",\n    \"attempts\": 4\n  }\n]\n", "WriteJSON indents with two spaces and ends with a newline")

	buf.Reset()
	check.NoError(WriteJSON(&buf, nil), "WriteJSON of a nil list")
	check.Equal(buf.String(), "[]\n", "a nil list is written as an empty array")
	buf.Reset()
	check.NoError(WriteJSON(&buf, []Entry{}), "WriteJSON of an empty list")
	check.Equal(buf.String(), "[]\n", "an empty list is written as an empty array")

	buf.Reset()
	results := []Result{
		{Member: "bo", Date: time.Date(2026, time.December, 1, 0, 0, 0, 0, time.UTC), Time: ErgTime(7 * time.Minute)},
		{Member: "al", Date: time.Date(2026, time.December, 1, 0, 0, 0, 0, time.UTC), Time: ErgTime(6*time.Minute + 59*time.Second + 900*time.Millisecond)},
	}
	check.NoError(WriteJSON(&buf, Standings(results)), "WriteJSON of fresh standings")
	var back []map[string]any
	check.NoError(json.Unmarshal(buf.Bytes(), &back), "the JSON WriteJSON writes is valid JSON")
	if len(back) == 2 {
		check.Equal(back[0]["member"], any("al"), "the fastest member comes first in the JSON")
		check.Equal(back[1]["best"], any("7:00.0"), "a best time of exactly seven minutes in the JSON")
		check.Equal(back[1]["rank"], any(2.0), "the second member's rank in the JSON")
	} else {
		check.Fail("the JSON array holds one object per member")
	}

	err = WriteJSON(fullWebsite{}, []Entry{one})
	check.ErrorIs(err, errBoardFull, "WriteJSON returns the error of a writer that fails")
}
