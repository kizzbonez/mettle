/**
 * `check/check.go`: the assertions every Go test can call, as `check.Equal(got, want, message)`
 * and so on. A failed check prints "FAIL: message" and the details to standard error, then ends
 * the test process, as the other languages' helpers do.
 */
export const GO_CHECK = String.raw`// Package check holds the assertions a lab test calls. The order is got, want, message.
package check

import (
	"errors"
	"fmt"
	"math"
	"os"
	"reflect"
	"strconv"
)

// Fail ends the test. MESSAGE is the one line a hidden test shows; DETAIL only a visible test.
func Fail(message string, detail ...string) {
	fmt.Fprintln(os.Stderr, "FAIL: "+message)
	for _, line := range detail {
		fmt.Fprintln(os.Stderr, line)
	}
	os.Exit(1)
}

// True fails the test unless CONDITION holds.
func True(condition bool, message string) {
	if !condition {
		Fail(message)
	}
}

// Equal compares deeply, as reflect.DeepEqual does, except that a nil slice or map equals an empty one.
func Equal[T any](got, want T, message string) {
	if same(reflect.ValueOf(&got).Elem(), reflect.ValueOf(&want).Elem(), 0) {
		return
	}
	if g, w, ok := multiline(any(got), any(want)); ok {
		Fail(message, textDetail(g, w)...)
	}
	Fail(message, "  expected: "+show(want), "  actual:   "+show(got))
}

// Near compares two floating-point numbers, which may differ by up to TOLERANCE.
func Near(got, want, tolerance float64, message string) {
	if math.IsNaN(got) || math.Abs(got-want) > tolerance {
		Fail(message, "  expected: "+show(want)+" (within "+show(tolerance)+")", "  actual:   "+show(got))
	}
}

// NoError fails the test if ERR is not nil.
func NoError(err error, message string) {
	if err != nil {
		Fail(message, "  unexpected error: "+show(err))
	}
}

// Error fails the test if ERR is nil.
func Error(err error, message string) {
	if err == nil {
		Fail(message, "  expected an error, got nil")
	}
}

// ErrorIs fails the test unless errors.Is(err, target) holds.
func ErrorIs(err, target error, message string) {
	if !errors.Is(err, target) {
		Fail(message, "  expected an error matching: "+show(target), "  actual:   "+show(err))
	}
}

// ErrorAs returns the error of type E in ERR's tree, and fails the test if there is none.
func ErrorAs[E error](err error, message string) E {
	found, ok := errors.AsType[E](err)
	if !ok {
		Fail(message, "  expected an error of type "+reflect.TypeFor[E]().String(), "  actual:   "+show(err))
	}
	return found
}

// Panics runs BODY, which must panic, and returns the value it panicked with.
func Panics(body func(), message string) (value any) {
	defer func() {
		value = recover()
		if value == nil {
			Fail(message, "  nothing panicked")
		}
	}()
	body()
	return nil
}

func show(value any) string {
	switch v := value.(type) {
	case nil:
		return "nil"
	case string:
		return strconv.Quote(v)
	case error:
		return "error " + strconv.Quote(v.Error())
	case fmt.Stringer:
		return v.String()
	}
	return fmt.Sprintf("%#v", value)
}

// same is reflect.DeepEqual, except that nil and empty slices and maps are equal.
func same(a, b reflect.Value, depth int) bool {
	if !a.IsValid() || !b.IsValid() || depth > 100 {
		return a.IsValid() == b.IsValid() && depth <= 100
	}
	if a.Type() != b.Type() {
		return false
	}
	switch a.Kind() {
	case reflect.Slice, reflect.Array:
		return sameItems(a, b, depth)
	case reflect.Map:
		return sameMaps(a, b, depth)
	case reflect.Struct:
		for i := range a.NumField() {
			if !same(a.Field(i), b.Field(i), depth+1) {
				return false
			}
		}
		return true
	case reflect.Pointer, reflect.Interface:
		if a.IsNil() || b.IsNil() {
			return a.IsNil() == b.IsNil()
		}
		return (a.Kind() == reflect.Pointer && a.Pointer() == b.Pointer()) || same(a.Elem(), b.Elem(), depth+1)
	case reflect.Func:
		return a.IsNil() && b.IsNil()
	}
	return a.Equal(b)
}

func sameItems(a, b reflect.Value, depth int) bool {
	if a.Len() != b.Len() {
		return false
	}
	for i := range a.Len() {
		if !same(a.Index(i), b.Index(i), depth+1) {
			return false
		}
	}
	return true
}

func sameMaps(a, b reflect.Value, depth int) bool {
	if a.Len() != b.Len() {
		return false
	}
	for _, key := range a.MapKeys() {
		other := b.MapIndex(key)
		if !other.IsValid() || !same(a.MapIndex(key), other, depth+1) {
			return false
		}
	}
	return true
}
`;
