package main

import (
	"bufio"
	"cmp"
	"fmt"
	"io"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// countCountries reads a visitor book from r and counts the visitors from
// each country. Each line holds one country; blank lines and lines starting
// with "#" are skipped, and spaces around a country are ignored.
func countCountries(r io.Reader) (map[string]int, error) {
	counts := map[string]int{}
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		counts[line]++
	}
	if err := sc.Err(); err != nil {
		return nil, fmt.Errorf("reading visitor book: %w", err)
	}
	return counts, nil
}

// writeSummary writes one "<country> <count>" line per country to w, most
// visitors first and countries with the same count in alphabetical order.
// It stops at the first write error and returns it.
func writeSummary(w io.Writer, counts map[string]int) error {
	countries := slices.SortedFunc(maps.Keys(counts), func(a, b string) int {
		return cmp.Or(cmp.Compare(counts[b], counts[a]), strings.Compare(a, b))
	})
	for _, country := range countries {
		if _, err := fmt.Fprintf(w, "%s %d\n", country, counts[country]); err != nil {
			return err
		}
	}
	return nil
}

// summarise reads the visitor book at inPath and saves its summary at
// outPath, creating outPath's folder if needed. The output file is written
// through a buffer, and errors from Flush and Close are reported too.
func summarise(inPath, outPath string) (err error) {
	in, err := os.Open(inPath)
	if err != nil {
		return err
	}
	defer in.Close()
	counts, err := countCountries(in)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
		return err
	}
	out, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := out.Close(); err == nil {
			err = closeErr
		}
	}()
	w := bufio.NewWriter(out)
	if err := writeSummary(w, counts); err != nil {
		return err
	}
	return w.Flush()
}
