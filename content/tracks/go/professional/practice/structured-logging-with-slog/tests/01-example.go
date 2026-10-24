import (
	"bytes"
	"context"
	"log/slog"
	"strings"
)

func Test(t *testing.T) {
	var buf bytes.Buffer
	level := new(slog.LevelVar)
	logger := newLogger(&buf, level)
	ctx := withKiosk(context.Background(), "north-door")
	logCheckIn(ctx, logger, Guest{Name: "Aino", Phone: "07700900123", Visits: 4}, "4821")

	want := `{"level":"INFO","msg":"guest checked in","guest":{"name":"Aino","phone":"********123","visits":4},"pin":"[redacted]","kiosk":"north-door"}`
	got := strings.TrimSpace(buf.String())
	check.Equal(got, want, "the JSON line logged for the example check-in")
	check.True(!strings.Contains(got, "07700900123"), "the full phone number is not in the log")
	check.True(!strings.Contains(got, "4821"), "the PIN is not in the log")
}
