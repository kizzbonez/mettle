/**
 * `check/text.go`: how check.Equal shows two texts of several lines, such as a program's output:
 * one numbered, quoted line per line, so spaces and tabs are visible, and the first line that
 * differs named. A single quoted string full of \n is hard to compare by eye.
 */
export const GO_CHECK_TEXT = String.raw`package check

import (
	"fmt"
	"strconv"
	"strings"
)

// multiline reports whether got and want are strings and either has more than one line.
func multiline(got, want any) (string, string, bool) {
	g, ok := got.(string)
	w, _ := want.(string)
	return g, w, ok && (strings.Contains(g, "\n") || strings.Contains(w, "\n"))
}

// textDetail is the detail of a failed check on two texts.
func textDetail(got, want string) []string {
	detail := append([]string{"  expected:"}, numbered(want)...)
	detail = append(detail, "  actual:")
	detail = append(detail, numbered(got)...)
	wantLines, gotLines := strings.Split(want, "\n"), strings.Split(got, "\n")
	for i := range max(len(wantLines), len(gotLines)) {
		if i >= len(wantLines) || i >= len(gotLines) || wantLines[i] != gotLines[i] {
			return append(detail, fmt.Sprintf("  first difference: line %d", i+1))
		}
	}
	return detail
}

func numbered(text string) []string {
	if text == "" {
		return []string{"     (nothing)"}
	}
	lines := strings.Split(text, "\n")
	shown := make([]string, len(lines))
	for i, line := range lines {
		shown[i] = fmt.Sprintf("  %3d %s", i+1, strconv.Quote(line))
	}
	return shown
}
`;
