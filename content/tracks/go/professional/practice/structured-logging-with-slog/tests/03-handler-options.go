import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
)

// optionLines decodes every JSON line in buf.
func optionLines(t *testing.T, buf *bytes.Buffer) []map[string]any {
	var out []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(buf.String()), "\n") {
		if line == "" {
			continue
		}
		var m map[string]any
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			t.Fatalf("a log line is not JSON: %q", line)
		}
		out = append(out, m)
	}
	return out
}

func Test(t *testing.T) {
	var buf bytes.Buffer
	level := new(slog.LevelVar)
	logger := newLogger(&buf, level)

	logger.Info("door opened", "door", "north", slog.Group("slot", "time", "18:00", "pin", "1111"), "card", "4111111111111111")
	lines := optionLines(t, &buf)
	if len(lines) != 1 {
		t.Fatalf("one Info call should log one line, got %d", len(lines))
	}
	line := lines[0]
	_, hasTime := line["time"]
	check.True(!hasTime, "the top-level time attribute is dropped")
	check.Equal(line["msg"], any("door opened"), "the message is kept")
	check.Equal(line["level"], any("INFO"), "the level is kept")
	check.Equal(line["door"], any("north"), "an ordinary attribute is kept")
	check.Equal(line["card"], any("[redacted]"), "a top-level card attribute is redacted")
	slot, ok := line["slot"].(map[string]any)
	check.True(ok, "a group is logged as a nested object")
	check.Equal(slot["time"], any("18:00"), "an attribute called time inside a group is kept")
	check.Equal(slot["pin"], any("[redacted]"), "a pin inside a group is redacted")
	check.True(!strings.Contains(buf.String(), "4111111111111111") && !strings.Contains(buf.String(), "1111\""), "no secret value reaches the output")

	buf.Reset()
	logger.Debug("thermometer read", "celsius", 82)
	check.Equal(buf.Len(), 0, "Debug is dropped while the LevelVar is at Info")
	level.Set(slog.LevelDebug)
	logger.Debug("thermometer read", "celsius", 82)
	check.Equal(len(optionLines(t, &buf)), 1, "Debug is logged after the LevelVar is set to Debug")
	buf.Reset()
	level.Set(slog.LevelError)
	logger.Warn("water low")
	check.Equal(buf.Len(), 0, "Warn is dropped after the LevelVar is set to Error")

	buf.Reset()
	level.Set(slog.LevelInfo)
	logCheckIn(context.Background(), logger, Guest{Name: "Aino", Phone: "07700900123", Visits: 0}, "9090")
	lines = optionLines(t, &buf)
	check.Equal(len(lines), 1, "at Info, a first visit logs only the check-in")
	check.True(!strings.Contains(buf.String(), "9090"), "logCheckIn's pin is redacted")
}
