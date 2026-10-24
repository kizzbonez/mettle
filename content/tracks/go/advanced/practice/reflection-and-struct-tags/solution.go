package main

import (
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"
)

var (
	errTarget      = errors.New("want a non-nil pointer to a struct")
	errMissing     = errors.New("missing required field")
	errBadValue    = errors.New("bad value")
	errUnsupported = errors.New("unsupported field kind")
)

// formTag returns the form key of a field and whether it is required. ok is
// false for a field the form never fills: unexported, untagged, or "-".
func formTag(field reflect.StructField) (key string, required, ok bool) {
	tag := field.Tag.Get("form")
	key, options, _ := strings.Cut(tag, ",")
	if !field.IsExported() || key == "" || key == "-" {
		return "", false, false
	}
	return key, options == "required", true
}

// keys returns the form keys of a struct, or of the struct a pointer points
// to, in the order of its fields. For anything else it returns nil.
func keys(v any) []string {
	t := reflect.TypeOf(v)
	if t != nil && t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	if t == nil || t.Kind() != reflect.Struct {
		return nil
	}
	var found []string
	for field := range t.Fields() {
		if key, _, ok := formTag(field); ok {
			found = append(found, key)
		}
	}
	return found
}

// fill copies the form's values into the struct dst points to, converting
// each one to its field's kind. It stops at the first problem.
func fill(dst any, form map[string]string) error {
	v := reflect.ValueOf(dst)
	if v.Kind() != reflect.Pointer || v.IsNil() || v.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("fill: %w, got %T", errTarget, dst)
	}
	for field, value := range v.Elem().Fields() {
		key, required, ok := formTag(field)
		if !ok {
			continue
		}
		text := strings.TrimSpace(form[key])
		if text == "" {
			if required {
				return fmt.Errorf("fill: %w %q", errMissing, key)
			}
			continue // nothing given: keep what the field holds
		}
		if err := set(value, text); err != nil {
			return fmt.Errorf("fill: %w for %q", err, key)
		}
	}
	return nil
}

// set converts text to value's kind and stores it. Sizes are respected:
// "300" does not fit an int8 and is a bad value.
func set(value reflect.Value, text string) error {
	switch value.Kind() {
	case reflect.String:
		value.SetString(text)
	case reflect.Bool:
		b, err := strconv.ParseBool(text)
		if err != nil {
			return fmt.Errorf("%w %q", errBadValue, text)
		}
		value.SetBool(b)
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		n, err := strconv.ParseInt(text, 10, value.Type().Bits())
		if err != nil {
			return fmt.Errorf("%w %q", errBadValue, text)
		}
		value.SetInt(n)
	case reflect.Float32, reflect.Float64:
		f, err := strconv.ParseFloat(text, value.Type().Bits())
		if err != nil {
			return fmt.Errorf("%w %q", errBadValue, text)
		}
		value.SetFloat(f)
	default:
		return fmt.Errorf("%w %s", errUnsupported, value.Kind())
	}
	return nil
}
