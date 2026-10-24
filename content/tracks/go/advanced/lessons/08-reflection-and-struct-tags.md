---
title: Reflection and Struct Tags
summary: Inspect and change values whose types you do not know at compile time with package reflect, read struct tags the way encoding/json does, walk fields and methods with Go 1.26's iterator methods, and know what reflection costs.
minutes: 35
objectives:
  - Get a value's reflect.Type, reflect.Value and Kind, and explain how Type and Kind differ
  - Walk a struct's fields with Type.Fields or Value.Fields and read their tags with Get and Lookup
  - Change a field through a pointer, checking CanSet, and call a method by name
  - Build a small validator driven by struct tags, and say when reflection is the wrong tool
---

## Outline

1. Why reflection exists, and what it costs
2. Type, Value and Kind
3. Walking a struct's fields
4. Struct tags
5. Changing values through a pointer
6. Methods, TypeFor and DeepEqual
7. A tiny validator driven by tags

## Why reflection exists, and what it costs

`fmt.Println` prints any struct, and `json.Marshal` turns any struct into JSON, yet neither was
written knowing your types. They use **reflection**: package `reflect` lets a program look at a
value's type and contents while it runs. A type switch (Medium lesson 03) handles the types
you list; reflection handles types nobody listed, such as the fields of a struct written later.

That power has a price. A mistake that the compiler would reject becomes a panic at run time, and
reflective code is slower: in a benchmark in this course's sandbox, setting a field by index
through `reflect` took 15 ns against 1.8 ns directly, and by name 100 ns. Use interfaces or generics when they can
do the job, and keep reflection for code that really must handle types it has never seen.

## Type, Value and Kind

`reflect.TypeOf(x)` returns a **`reflect.Type`**, the type of the value inside the interface `x`.
`reflect.ValueOf(x)` returns a **`reflect.Value`**, the value itself. A type's **Kind** is the
kind of thing it is built from: `int`, `float64`, `struct`, `slice`, `ptr` and so on.

```go
type Celsius float64

type Hive struct {
	Name   string
	Frames int
	temp   Celsius
}

func main() {
	for _, v := range []any{42, "bees", Celsius(34.5), []int{1, 2}, Hive{}, &Hive{}} {
		t := reflect.TypeOf(v)
		fmt.Printf("%-14v kind %v\n", t, t.Kind())
	}
}
```

```text
int            kind int
string         kind string
main.Celsius   kind float64
[]int          kind slice
main.Hive      kind struct
*main.Hive     kind ptr
```

`Celsius` and `float64` are different types with the same kind. Reflective code usually
switches on the kind (`reflect.Struct`, `reflect.Pointer`, `reflect.Int`), because there are
only a couple of dozen kinds but endless types.

## Walking a struct's fields

A struct's fields are numbered from 0: `t.NumField()` says how many, `t.Field(i)` returns a
**`reflect.StructField`** with the field's `Name`, `Type` and `Tag`. Go 1.26 added iterator
methods, so a `for range` does the counting: `Type.Fields()` yields each `StructField`, and
`Value.Fields()` yields each `StructField` together with the field's `Value`. `Type.Methods`,
`Type.Ins`, `Type.Outs` and `Value.Methods` work the same way.

```go
type Hive struct {
	Name   string `json:"name" validate:"required"`
	Frames int    `json:"frames,omitempty" validate:"min=1"`
	Queen  bool   `json:"-"`
	notes  string
}

func main() {
	h := Hive{Name: "Clover", Frames: 9}
	for field, value := range reflect.ValueOf(h).Fields() {
		json, ok := field.Tag.Lookup("json")
		fmt.Printf("%-6s %-6v exported=%-5v json=%q (%v) validate=%q\n",
			field.Name, field.Type, field.IsExported(), json, ok, field.Tag.Get("validate"))
		if field.IsExported() {
			fmt.Println("       value:", value.Interface())
		}
	}
}
```

```text
Name   string exported=true  json="name" (true) validate="required"
       value: Clover
Frames int    exported=true  json="frames,omitempty" (true) validate="min=1"
       value: 9
Queen  bool   exported=true  json="-" (true) validate=""
       value: false
notes  string exported=false json="" (false) validate=""
```

`value.Interface()` turns a `reflect.Value` back into an `any`. For an unexported field it
panics: `reflect.Value.Interface: cannot return value obtained from unexported field or method`.
Reflection still lets you see that `notes` exists, but not hand its value out.

## Struct tags

A **struct tag** is the raw string literal after a field's type. By convention it is a list of
`key:"value"` pairs separated by spaces. `Tag.Get(key)` returns the value, or `""` when the key is
missing; `Tag.Lookup(key)` also returns whether the key was there, which matters when an empty
value means something.

This is how `encoding/json` decides what to write. It reads the `json` key: the first part is the
name in JSON, `omitempty` drops a zero value, and `-` skips the field. Unexported fields are never
written, because reflection cannot read them out:

```text
{"name":"Clover","frames":9}
{"name":"Bramble"}
```

Those are `json.Marshal` of `Hive{Name: "Clover", Frames: 9, Queen: true, notes: "calm"}` and of
`Hive{Name: "Bramble"}`. The syntax is strict: no space after the colon. `go vet` checks it:

```text
main.go:9:2: struct field tag `json: "name"` not compatible with reflect.StructTag.Get: bad syntax for struct tag value
```

The compiler accepts that tag, and `json.Marshal` silently ignores it and writes `"Name"`.

## Changing values through a pointer

`reflect.ValueOf(h)` holds a copy of `h`, so changing it could not change `h`, and reflection
refuses. Pass a pointer and call **`Elem`** to reach the value it points to. A value you may
change reports **`CanSet()`** true:

```go
type Hive struct {
	Name   string
	Frames int
}

h := Hive{Name: "Clover", Frames: 9}

v := reflect.ValueOf(h) // a copy of h
fmt.Println("through a copy:", v.Field(1).CanSet())

p := reflect.ValueOf(&h).Elem() // h itself, through its address
fmt.Println("through a pointer:", p.Field(1).CanSet())
p.FieldByName("Frames").SetInt(10)
p.FieldByName("Name").SetString("Clover II")
fmt.Printf("%+v\n", h)

v.Field(1).SetInt(11)
```

```text
through a copy: false
through a pointer: true
{Name:Clover II Frames:10}
panic: reflect: reflect.Value.SetInt using unaddressable value
```

The setter must match the kind: `SetString` on an `int` field panics too. Unexported fields
are never settable, even through a pointer.

## Methods, TypeFor and DeepEqual

`Value.MethodByName("Honey")` returns the method bound to its receiver; `Call` takes and returns
`[]reflect.Value`. **`reflect.TypeFor[T]()`** gives the `Type` of a type you can name, with no
value needed.

```go
func (h Hive) Honey(kgPerFrame float64) float64 { return float64(h.Frames) * kgPerFrame }
func (h *Hive) AddFrame()                       { h.Frames++ }

for m := range reflect.TypeFor[*Hive]().Methods() {
	fmt.Println("*Hive has", m.Name)
}
honey := reflect.ValueOf(Hive{Name: "Clover", Frames: 9}).MethodByName("Honey")
out := honey.Call([]reflect.Value{reflect.ValueOf(2.5)})
fmt.Println("Honey(2.5) =", out[0].Float())
fmt.Println(reflect.DeepEqual([]int{}, []int(nil)))
```

```text
*Hive has AddFrame
*Hive has Honey
Honey(2.5) = 22.5
false
```

`*Hive`'s method set includes the value-receiver `Honey`; `Hive`'s alone would not list
`AddFrame`. **`reflect.DeepEqual`** compares slices, maps and structs element by element, but a
nil slice and an empty one are not equal to it.

## A tiny validator driven by tags

Put together, this is enough to write the kind of tool that libraries offer: rules in tags,
checked by one function for any struct.

```go
type Hive struct {
	Name   string `check:"required"`
	Frames int    `check:"min=1"`
	Site   string
}

// validate checks the struct v points to against its fields' check tags:
// "required" (not the zero value) or "min=N" (an integer of at least N).
func validate(v any) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Pointer || rv.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("validate: want a pointer to a struct, got %T", v)
	}
	var errs []error
	for field, value := range rv.Elem().Fields() {
		rule, ok := field.Tag.Lookup("check")
		if !ok {
			continue // no rule for this field
		}
		if rule == "required" && value.IsZero() {
			errs = append(errs, fmt.Errorf("%s is required", field.Name))
		} else if limit, found := strings.CutPrefix(rule, "min="); found {
			n, err := strconv.Atoi(limit)
			if err != nil || !value.CanInt() {
				return fmt.Errorf("validate: bad rule %q on %s", rule, field.Name)
			}
			if value.Int() < int64(n) {
				errs = append(errs, fmt.Errorf("%s is %d, below %d", field.Name, value.Int(), n))
			}
		}
	}
	return errors.Join(errs...)
}
```

For `&Hive{Name: "Clover", Frames: 9}`, then `&Hive{Frames: 0}`, then `Hive{}`:

```text
<nil>
Name is required
Frames is 0, below 1
validate: want a pointer to a struct, got main.Hive
```

`strings.CutPrefix` returns the text after `min=` and whether the prefix was there.
`value.IsZero()` works for every kind, and `value.CanInt()` guards `value.Int()`, which panics on
a field that is not an integer. A typo in a rule is found only when the code runs: the price of
reflection.

## Common mistakes

- **Setting through a copy.** `reflect.ValueOf(h).Field(1).SetInt(11)` panics with
  `using unaddressable value`. Pass `&h` and call `Elem()`.
- **Calling `Interface()` on an unexported field.** It panics; check `field.IsExported()` first.
- **A space in a tag.** `json: "name"` is ignored without an error at run time. Run `go vet`.
- **Calling a getter of the wrong kind.** `reflect.ValueOf("bees").Int()` panics with
  `reflect: call of reflect.Value.Int on string Value`. Check `Kind()` or `CanInt()` first.

## Practice

1. Print the kind of `map[string]int{}` and of `func() {}`.
2. Write `fieldNames(v any) []string` that returns the names of the exported fields of a struct.
3. With the `check` tags of the validator, what does `validate` return for
   `Frames: -2` with a name, and for a field tagged `check:"min=one"`?

### Answers

```go
fmt.Println(reflect.TypeOf(map[string]int{}).Kind(), reflect.TypeOf(func() {}).Kind())

func fieldNames(v any) []string {
	var names []string
	for field := range reflect.TypeOf(v).Fields() {
		if field.IsExported() {
			names = append(names, field.Name)
		}
	}
	return names
}
```

```text
map func
[Name Frames Queen]
Frames is -2, below 1
validate: bad rule "min=one" on Frames
```

The second line is `fieldNames(Hive{})` for the `Hive` with `json` tags. The bad rule is
reported only when `validate` runs, which is why such tags deserve a test.

## Key takeaways

- `reflect.TypeOf` and `reflect.ValueOf` unpack an `any`; switch on `Kind`, compare `Type`.
- `Type.Fields()` and `Value.Fields()` (Go 1.26) iterate over a struct's fields; tags come from
  `Tag.Get` and `Tag.Lookup`.
- To change a value, reflect on a pointer, call `Elem`, and check `CanSet`.
- Reflection is how `encoding/json` reads tags, and it is slow and checked only at run time:
  prefer interfaces and generics when they fit.

## Further reading

- [Package reflect](https://pkg.go.dev/reflect)
- [The Go Blog: The Laws of Reflection](https://go.dev/blog/laws-of-reflection)
- [Go 1.26 release notes](https://go.dev/doc/go1.26)
- [Learn Go with Tests: Reflection](https://quii.gitbook.io/learn-go-with-tests/go-fundamentals/reflection)
