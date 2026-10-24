import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

func Test(t *testing.T) {
	good := []struct {
		text string
		want time.Duration
	}{
		{"7:12.4", 7*time.Minute + 12*time.Second + 400*time.Millisecond},
		{"6:58.0", 6*time.Minute + 58*time.Second},
		{"0:59.9", 59*time.Second + 900*time.Millisecond},
		{"12:00.0", 12 * time.Minute},
		{"07:00.1", 7*time.Minute + 100*time.Millisecond},
		{"125:30.5", 125*time.Minute + 30*time.Second + 500*time.Millisecond},
	}
	for _, g := range good {
		got, err := ParseErgTime(g.text)
		check.NoError(err, "ParseErgTime of a well-formed time")
		check.Equal(time.Duration(got), g.want, "the duration ParseErgTime reads from a well-formed time")
	}

	for _, bad := range []string{"7:5.2", "7:60.0", "7:12", "7:12.45", ":12.4", "-7:12.4", " 7:12.4", "7:12.4 ", "7.12.4", "7:1a.4", "7:12.", "", "7:12:4", "seven"} {
		_, err := ParseErgTime(bad)
		check.True(errors.Is(err, ErrBadTime), "ParseErgTime rejects a badly written time with an error that wraps ErrBadTime")
		if err != nil {
			check.True(strings.Contains(err.Error(), fmt.Sprintf("%q", bad)), "the error for a badly written time quotes the text")
		}
	}
	_, err := ParseErgTime("7:5.2")
	if err != nil {
		check.Equal(err.Error(), `bad erg time "7:5.2"`, "the exact text of the error for 7:5.2")
	}

	check.Equal(ErgTime(7*time.Minute+12*time.Second+400*time.Millisecond).String(), "7:12.4", "String of 7:12.4")
	check.Equal(ErgTime(6*time.Minute+5*time.Second).String(), "6:05.0", "String pads the seconds to two digits")
	check.Equal(ErgTime(42*time.Second+300*time.Millisecond).String(), "0:42.3", "String of a time under a minute")
	check.Equal(ErgTime(65*time.Minute).String(), "65:00.0", "String of a time over an hour, in minutes")
	check.Equal(ErgTime(7*time.Minute+12*time.Second+490*time.Millisecond).String(), "7:12.4", "String drops anything below a tenth")
	check.Equal(fmt.Sprint(ErgTime(8*time.Minute)), "8:00.0", "an ErgTime prints through fmt as m:ss.t")

	data, err := json.Marshal(ErgTime(7*time.Minute + 3*time.Second + 700*time.Millisecond))
	check.NoError(err, "json.Marshal of an ErgTime")
	check.Equal(string(data), `"7:03.7"`, "an ErgTime marshals as a JSON string")
	data, err = json.Marshal(map[string]ErgTime{"best": ErgTime(6 * time.Minute)})
	check.NoError(err, "json.Marshal of a map holding an ErgTime")
	check.Equal(string(data), `{"best":"6:00.0"}`, "an ErgTime inside a map marshals as a JSON string")

	for _, g := range good[:4] {
		parsed, err := ParseErgTime(g.text)
		check.NoError(err, "ParseErgTime before a round trip")
		check.Equal(parsed.String(), g.text, "String gives back the text a time was parsed from")
	}
}
