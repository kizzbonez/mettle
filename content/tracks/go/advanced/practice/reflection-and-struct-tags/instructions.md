Write the two functions in `solution.go` with package `reflect`, adding the imports you need
(`fmt`, `reflect`, `strconv`, `strings`). The four sentinel errors are declared for you.

A field takes part in a form when it is **exported** and has a `form` tag. The tag holds the
field's key, optionally followed by `,required`: `form:"name,required"`. A field with no `form`
tag, an empty key, or the key `-` is never filled, and neither is an unexported field, whatever
its tag says.

1. **`keys(v any) []string`** returns the keys of the fields that take part, in the order the
   fields are declared. `v` may be a struct or a pointer to a struct (even a nil pointer: you
   only need its type). For anything else, return `nil`. Use `Type.Fields()`.
2. **`fill(dst any, form map[string]string) error`** fills the struct that `dst` points to.
   - If `dst` is not a non-nil pointer to a struct, return
     `fmt.Errorf("fill: %w, got %T", errTarget, dst)` and change nothing.
   - Go through the fields in order (`Value.Fields()` on the struct, reached with `Elem()`). For
     each field that takes part, look up its key and remove the spaces around the text
     (`strings.TrimSpace`).
   - If the text is then empty (the key is missing, or holds only spaces), leave the field as it
     is. But if the field is required, return `fmt.Errorf("fill: %w %q", errMissing, key)`.
   - Otherwise convert the text to the field's kind and set it: a `string` as it is; an `int`,
     `int8`, `int16`, `int32` or `int64` with `strconv.ParseInt(text, 10, bits)`, where `bits` is
     the field type's `Bits()`, so that `"300"` does not fit an `int8`; a `float32` or `float64`
     with `strconv.ParseFloat(text, bits)`; a `bool` with `strconv.ParseBool`.
   - If the text does not convert, return `fmt.Errorf("fill: %w %q for %q", errBadValue, text, key)`.
     If the field has any other kind (a slice, a `uint`, a struct...), return
     `fmt.Errorf("fill: %w %s for %q", errUnsupported, kind, key)`, where `kind` is the field
     value's `Kind()`.
   - Stop at the first problem. With no problem, return `nil`.

The tests declare their own form structs, all with names that start with `test`, such as
`testMember`; give your own declarations other names.

Example:

```go
type Member struct {
	Name    string  `form:"name,required"`
	Age     int     `form:"age"`
	Weight  float64 `form:"weight_kg"`
	Swimmer bool    `form:"swimmer,required"`
	Notes   string  // no tag: never filled
	Club    string  `form:"-"`
}

keys(Member{}) // [name age weight_kg swimmer]

m := Member{Club: "River"}
err := fill(&m, map[string]string{"name": " Ada ", "age": "34", "weight_kg": "61.5", "swimmer": "true", "Notes": "x"})
// err == nil, m is {Name:Ada Age:34 Weight:61.5 Swimmer:true Notes: Club:River}

fill(&m, map[string]string{"name": "Bo", "age": "ten", "swimmer": "true"})
// fill: bad value "ten" for "age"
fill(&m, map[string]string{"name": "Bo"})
// fill: missing required field "swimmer"
fill(m, map[string]string{})
// fill: want a non-nil pointer to a struct, got main.Member
```
