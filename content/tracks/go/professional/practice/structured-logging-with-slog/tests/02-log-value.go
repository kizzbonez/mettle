import (
	"bytes"
	"log/slog"
	"strings"
)

// valueAttrs resolves a guest's LogValue into its group's attributes as key/value strings.
func valueAttrs(g Guest) (slog.Kind, []string) {
	v := g.LogValue()
	if v.Kind() != slog.KindGroup {
		return v.Kind(), nil
	}
	var parts []string
	for _, a := range v.Group() {
		parts = append(parts, a.Key+"="+a.Value.Resolve().String())
	}
	return v.Kind(), parts
}

func Test(t *testing.T) {
	kind, parts := valueAttrs(Guest{Name: "Aino", Phone: "07700900123", Visits: 4})
	check.Equal(kind, slog.KindGroup, "LogValue returns a group value")
	check.Equal(parts, []string{"name=Aino", "phone=********123", "visits=4"}, "the group's attributes, in order")

	phones := []struct{ phone, masked, what string }{
		{"4567", "*567", "a four-digit phone"},
		{"123", "***", "exactly three characters"},
		{"12", "**", "fewer than three characters"},
		{"", "", "an empty phone"},
		{"+3584012345678", "***********678", "an international number"},
	}
	for _, p := range phones {
		_, parts := valueAttrs(Guest{Name: "Matti", Phone: p.phone})
		check.True(len(parts) == 3 && parts[1] == "phone="+p.masked, "the masked phone for "+p.what)
	}

	_, parts = valueAttrs(Guest{Name: "Liisa", Phone: "0401234567", Visits: 0})
	check.True(len(parts) == 3 && parts[2] == "visits=0", "visits is logged even when it is 0")

	var buf bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&buf, nil))
	logger.Info("seen", "guest", Guest{Name: "Eero", Phone: "0509876543", Visits: 2})
	out := buf.String()
	check.True(strings.Contains(out, "guest.name=Eero") && strings.Contains(out, "guest.phone=*******543"), "a text handler logs the guest as a group")
	check.True(!strings.Contains(out, "0509876543"), "the full phone number never reaches the output")
}
