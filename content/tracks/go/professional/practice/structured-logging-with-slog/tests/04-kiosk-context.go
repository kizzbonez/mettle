import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
)

// kioskLines decodes every JSON line in buf.
func kioskLines(t *testing.T, buf *bytes.Buffer) []map[string]any {
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
	ctx := withKiosk(context.Background(), "jetty")

	logger.InfoContext(ctx, "towel issued")
	logger.InfoContext(context.Background(), "towel issued")
	logger.With("sauna", "lake").InfoContext(ctx, "stove lit")
	logger.WithGroup("stove").InfoContext(ctx, "stove lit", "celsius", 85)
	lines := kioskLines(t, &buf)
	if len(lines) != 4 {
		t.Fatalf("four calls should log four lines, got %d", len(lines))
	}
	check.Equal(lines[0]["kiosk"], any("jetty"), "the kiosk ID from the context is logged")
	_, has := lines[1]["kiosk"]
	check.True(!has, "no kiosk attribute when the context has no kiosk ID")
	check.Equal(lines[2]["kiosk"], any("jetty"), "the kiosk ID is still logged after logger.With")
	check.Equal(lines[2]["sauna"], any("lake"), "the attributes from logger.With are logged")
	stove, _ := lines[3]["stove"].(map[string]any)
	check.True(lines[3]["kiosk"] == "jetty" || (stove != nil && stove["kiosk"] == "jetty"), "the kiosk ID is still logged after logger.WithGroup")

	buf.Reset()
	level.Set(slog.LevelDebug)
	logCheckIn(ctx, logger, Guest{Name: "Ville", Phone: "0441112223", Visits: 0}, "5555")
	lines = kioskLines(t, &buf)
	if len(lines) != 2 {
		t.Fatalf("at Debug, a first visit should log two lines, got %d", len(lines))
	}
	check.Equal(lines[0]["msg"], any("new guest"), "the Debug line comes first")
	check.Equal(lines[0]["level"], any("DEBUG"), "the new-guest line is logged at Debug")
	check.Equal(lines[0]["name"], any("Ville"), "the new-guest line names the guest")
	check.Equal(lines[0]["kiosk"], any("jetty"), "the new-guest line is logged with the context")
	check.Equal(lines[1]["msg"], any("guest checked in"), "the check-in line comes second")

	buf.Reset()
	logCheckIn(ctx, logger, Guest{Name: "Ville", Phone: "0441112223", Visits: 1}, "5555")
	check.Equal(len(kioskLines(t, &buf)), 1, "a returning guest logs only the check-in, even at Debug")
}
