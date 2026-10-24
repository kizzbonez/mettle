package main

import "io"

// countCountries reads a visitor book from r and counts the visitors from
// each country.
func countCountries(r io.Reader) (map[string]int, error) {
	panic("not implemented")
}

// writeSummary writes one line per country to w, most visitors first.
func writeSummary(w io.Writer, counts map[string]int) error {
	panic("not implemented")
}

// summarise reads the visitor book at inPath and saves its summary at
// outPath.
func summarise(inPath, outPath string) (err error) {
	panic("not implemented")
}
