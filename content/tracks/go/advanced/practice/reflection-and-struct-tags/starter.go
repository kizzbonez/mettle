package main

import "errors"

var (
	errTarget      = errors.New("want a non-nil pointer to a struct")
	errMissing     = errors.New("missing required field")
	errBadValue    = errors.New("bad value")
	errUnsupported = errors.New("unsupported field kind")
)

// keys returns the form keys of a struct, or of the struct a pointer points
// to, in the order of its fields. For anything else it returns nil.
func keys(v any) []string {
	panic("not implemented")
}

// fill copies the form's values into the struct dst points to, converting
// each one to its field's kind. It stops at the first problem.
func fill(dst any, form map[string]string) error {
	panic("not implemented")
}
