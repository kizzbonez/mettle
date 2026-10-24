import (
	"strconv"
	"strings"
)

func Test(t *testing.T) {
	ran := check.RunScript("")
	lines := strings.Split(strings.TrimSuffix(ran.Out, "\n"), "\n")
	want := []string{
		"Label 00042",
		"Comté         325 g",
		"Fat 45% in dry matter",
		"24.90 EUR/kg",
		"To pay:     8.09 EUR",
	}
	check.Equal(len(lines), len(want), "the number of lines printed to standard output")
	for i := range want {
		check.Equal(lines[i], want[i], "line "+strconv.Itoa(i+1)+" of the label")
	}
	check.Equal(ran.Err, "label 42 printed for \"Comté\"\n", "the log line on standard error")
}
