---
title: JSON and Other Encodings
summary: Turn Go values into JSON and back with encoding/json, control fields with struct tags, stream with decoders and encoders, write custom MarshalJSON and UnmarshalJSON methods, meet Go 1.27's encoding/json/v2, and read and write CSV, base64 and hex.
minutes: 40
objectives:
  - Marshal and unmarshal structs, maps and slices, and control field names and omission with struct tags
  - Decode and encode streams with json.Decoder and json.Encoder, and reject unknown fields
  - Give a type its own JSON form with MarshalJSON and UnmarshalJSON
  - Explain what changed in Go 1.27's encoding/json and how encoding/json/v2's defaults differ, and read and write CSV
---

## Outline

1. From Go to JSON with Marshal
2. Struct tags
3. From JSON to Go with Unmarshal
4. Streams: Decoder and Encoder
5. A type's own JSON form
6. Go 1.27: encoding/json/v2
7. CSV, base64 and hex

## From Go to JSON with Marshal

**JSON** is the text format most web APIs and many configuration files use: objects `{"name": value}`, arrays `[...]`, strings, numbers, `true`, `false` and `null`. Package `encoding/json` converts Go values to JSON, which is called **marshalling**, and back, called **unmarshalling**. A struct becomes an object, a slice an array, a map with string keys an object. Only **exported** fields are marshalled, because the package can only see those (Medium 01).

```go
type Book struct {
	Title  string   `json:"title"`
	Author string   `json:"author,omitempty"`
	Pages  int      `json:"pages,omitzero"`
	ISBN   string   `json:"-"`
	Tags   []string `json:"tags"`
	Copies int      `json:"copies,string"`
	shelf  string
}

func main() {
	data, err := json.Marshal(Book{Title: "Dune", ISBN: "978-0441013593", Copies: 2, shelf: "B4"})
	fmt.Println(string(data), err)
}
```

```text
{"title":"Dune","tags":null,"copies":"2"} <nil>
```

`Marshal` returns compact `[]byte`; `json.MarshalIndent(v, "", "  ")` returns the same JSON with line breaks and two-space indentation, for people to read. The unexported `shelf` never appears.

## Struct tags

The text in backquotes after a field is a **struct tag**, a string the `json` package reads at run time (Advanced 08 shows how). Its first part is the JSON name; options follow after commas:

- `json:"title"` names the member `title` instead of `Title`;
- `omitempty` leaves the member out when the value is empty: `false`, 0, `""`, a nil pointer or interface, or an empty slice or map;
- `omitzero` (Go 1.24) leaves it out when it is the type's zero value, or when its `IsZero()` method says so;
- `json:"-"` never marshals or unmarshals the field, the right choice for anything secret;
- `string` writes a number or bool inside a JSON string, as `copies` shows.

`"tags":null` shows a trap: a nil slice marshals as `null`, which some clients reject. Use `[]string{}` when you mean an empty list.

## From JSON to Go with Unmarshal

`json.Unmarshal(data, &v)` fills `v`, so it needs a pointer:

```go
var b Book
err := json.Unmarshal([]byte(`{"TITLE":"Emma","pages":474,"copies":"3","rating":5}`), &b)
fmt.Printf("%+v %v\n", b, err)

err = json.Unmarshal([]byte(`{"title":"Emma","pages":"474"}`), &b)
fmt.Println(err)

var doc map[string]any
err = json.Unmarshal([]byte(`{"title":"Emma","pages":474,"tags":["classic"]}`), &doc)
fmt.Println(doc, err)
fmt.Printf("%T %T\n", doc["pages"], doc["tags"])
```

```text
{Title:Emma Author: Pages:474 ISBN: Tags:[] Copies:3 shelf:} <nil>
json: cannot unmarshal string into Go struct field Book.pages of type int
map[pages:474 tags:[classic] title:Emma] <nil>
float64 []interface {}
```

Three rules show. Names match **case-insensitively** (`TITLE` filled `Title`). Members with no field, like `rating`, are silently **ignored**. And a type mismatch is an error that names the field. A `map[string]any` takes any shape, but every number becomes a `float64` and every array a `[]any`, so using them needs type assertions (Medium 03). Prefer a struct when you know the shape.

## Streams: Decoder and Encoder

`json.NewDecoder(r)` reads JSON values one after another from an `io.Reader`, and `json.NewEncoder(w)` writes them to an `io.Writer`, each followed by a newline. `DisallowUnknownFields` turns ignored members into errors, which catches typos in configuration files and requests:

```go
// copyLoans decodes one loan after another from r and re-encodes each to w.
func copyLoans(w io.Writer, r io.Reader) error {
	dec := json.NewDecoder(r)
	dec.DisallowUnknownFields()
	enc := json.NewEncoder(w)
	for {
		var l Loan
		err := dec.Decode(&l)
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return err
		}
		if err := enc.Encode(l); err != nil {
			return err
		}
	}
}
```

`Loan` has `title` and `member` fields. Given three loans, the third with an extra `"fine":40`, `fmt.Println(copyLoans(os.Stdout, r))` prints:

```text
{"title":"Emma","member":7}
{"title":"Dune","member":12}
json: unknown field "fine"
```

`Decode` returns `io.EOF` when the input ends cleanly between values, and `io.ErrUnexpectedEOF` (`unexpected EOF`) when it stops in the middle of one. `enc.SetIndent("", "  ")` indents like `MarshalIndent`.

## A type's own JSON form

A type with a `MarshalJSON() ([]byte, error)` method, the `json.Marshaler` interface, decides its own JSON; `UnmarshalJSON([]byte) error` on the pointer reads it back. Here a size stored as a small integer travels as a readable name:

```go
type Size int

const (
	Small Size = iota
	Medium
	Large
)

var sizeNames = []string{"small", "medium", "large"}

func (s Size) MarshalJSON() ([]byte, error) {
	if s < 0 || int(s) >= len(sizeNames) {
		return nil, fmt.Errorf("invalid size %d", int(s))
	}
	return json.Marshal(sizeNames[s])
}

func (s *Size) UnmarshalJSON(data []byte) error {
	var name string
	if err := json.Unmarshal(data, &name); err != nil {
		return err
	}
	i := slices.Index(sizeNames, name)
	if i < 0 {
		return fmt.Errorf("unknown size %q", name)
	}
	*s = Size(i)
	return nil
}

type Order struct {
	Drink string `json:"drink"`
	Size  Size   `json:"size"`
}
```

Marshalling `[]Order{{"latte", Large}, {"tea", Small}}`, then unmarshalling an order of size `"medium"` and one of size `"huge"`, prints:

```text
[{"drink":"latte","size":"large"},{"drink":"tea","size":"small"}] <nil>
{Drink:mocha Size:1} <nil>
unknown size "huge"
```

`data` is the raw JSON of the value, quotes included, so decode it with `json.Unmarshal` rather than slicing it by hand. The pointer receiver lets `UnmarshalJSON` change the value (Medium 02).

## Go 1.27: encoding/json/v2

Go 1.27 adds two standard packages: **`encoding/json/v2`**, a revised API, and **`encoding/json/jsontext`**, which handles the JSON syntax underneath. `encoding/json` itself now runs on the v2 code, set to keep its old behaviour: the same results, faster unmarshalling, possibly different error texts (`GOEXPERIMENT=nojsonv2` at build time restores the old code for now). The package documentation says new code should use v2; v1 stays supported for ever. Both packages are named `json`, so import v1 under another name to compare them:

```go
import (
	jsonv1 "encoding/json"
	"encoding/json/v2"
)

type Item struct {
	Title string   `json:"title"`
	Tags  []string `json:"tags"`
	Count int      `json:"count,omitempty"`
}

func main() {
	old, err := jsonv1.Marshal(Item{Title: "Dune"})
	fmt.Println(string(old), err)
	data, err := json.Marshal(Item{Title: "Dune"})
	fmt.Println(string(data), err)

	for _, in := range []string{
		`{"TITLE":"Emma"}`,
		`{"title":"Emma","title":"Dune"}`,
		"{\"title\":\"Caf\xe9\"}",
	} {
		var a, b Item
		errV1 := jsonv1.Unmarshal([]byte(in), &a)
		errV2 := json.Unmarshal([]byte(in), &b)
		fmt.Printf("v1: %q %v\nv2: %q %v\n", a.Title, errV1, b.Title, errV2)
	}
}
```

```text
{"title":"Dune","tags":null} <nil>
{"title":"Dune","tags":[],"count":0} <nil>
v1: "Emma" <nil>
v2: "" <nil>
v1: "Dune" <nil>
v2: "Emma" jsontext: duplicate object member name "title"
v1: "Caf�" <nil>
v2: "" jsontext: invalid UTF-8 within "/title" after offset 13
```

`\xe9` is a lone byte that is not valid UTF-8. In v2 a nil slice marshals as `[]`; names match **case-sensitively**; duplicate names and invalid UTF-8 are errors instead of silent guesses; and `omitempty` means "empty in JSON" (`null`, `""`, `{}`, `[]`), so a 0 stays: use `omitzero` for numbers. v2 has `json.MarshalWrite(w, v)` and `json.UnmarshalRead(r, &v)` for streams, and options as extra arguments, such as `json.RejectUnknownMembers(true)` or `jsontext.WithIndent("  ")`. The rest of this lesson and its lab use v1, which most existing code imports.

## CSV, base64 and hex

`encoding/csv` reads and writes comma-separated values, handling quotes for you:

```go
in := "title,pages\nEmma,474\n\"Smith, Jones and Co\",12\n"
records, err := csv.NewReader(strings.NewReader(in)).ReadAll()
fmt.Printf("%q %v\n", records, err)

w := csv.NewWriter(os.Stdout)
w.Write([]string{"Dune", `has a "quote", and a comma`})
w.Flush()
fmt.Println(w.Error())
```

```text
[["title" "pages"] ["Emma" "474"] ["Smith, Jones and Co" "12"]] <nil>
Dune,"has a ""quote"", and a comma"
<nil>
```

Every record needs as many fields as the first, or you get `record on line 2: wrong number of fields`. `csv.Writer` buffers like `bufio.Writer`: `Flush`, then check `w.Error()`.

`encoding/base64` turns bytes into text: `base64.StdEncoding.EncodeToString([]byte("hi?>"))` is `aGk/Pg==`, and `URLEncoding` gives `aGk_Pg==`, safe in URLs. A `[]byte` field marshals to JSON as such a base64 string. `hex.EncodeToString([]byte("hi"))` is `6869`.

## Common mistakes

- **Unexported fields.** `type point struct{ x, y int }` marshals as `{}`. Export the fields and add tags for lower-case names.
- **Passing a value to Unmarshal.** `json.Unmarshal(data, b)` returns `json: Unmarshal(non-pointer main.Book)`, and `go vet` reports `call of Unmarshal passes non-pointer as second argument`. Pass `&b`.
- **Ignoring the error.** Bad input then leaves a half-filled struct that looks valid. Always check it.
- **`omitempty` on a number in v2, or on a struct in v1.** It is never omitted (v1 writes `"in":{}`). Use `omitzero`.
- **Expecting `int` from `map[string]any`.** `doc["pages"].(int)` panics; it is a `float64`.

## Practice

1. Marshal `struct{ Name string; Age int }{"Ada", 36}` with tags that give `{"name":"Ada"}` when `Age` is 0.
2. Decode `[{"title":"Emma"},{"title":"Dune"}]` into a `[]Book` and print the titles.
3. Write `{"title":"Emma"}` and `{"title":"Dune"}` to `os.Stdout` with one `json.Encoder`.

### Answers

```go
type person struct {
	Name string `json:"name"`
	Age  int    `json:"age,omitzero"`
}

type entry struct {
	Title string `json:"title"`
}

func main() {
	data, err := json.Marshal(person{Name: "Ada"})
	fmt.Println(string(data), err)

	var books []entry
	err = json.Unmarshal([]byte(`[{"title":"Emma"},{"title":"Dune"}]`), &books)
	fmt.Println(books, err)

	enc := json.NewEncoder(os.Stdout)
	for _, b := range books {
		if err := enc.Encode(b); err != nil {
			fmt.Println(err)
		}
	}
}
```

```text
{"name":"Ada"} <nil>
[{Emma} {Dune}] <nil>
{"title":"Emma"}
{"title":"Dune"}
```

## Key takeaways

- `json.Marshal` and `json.Unmarshal(data, &v)` map structs to objects; only exported fields count.
- Tags rename (`json:"name"`), omit (`omitempty`, `omitzero`), hide (`"-"`) and quote numbers (`string`).
- v1 matches names case-insensitively and ignores unknown members unless you call `DisallowUnknownFields`.
- Decoders and encoders stream JSON over readers and writers; `MarshalJSON` and `UnmarshalJSON` give a type its own form.
- Go 1.27 runs `encoding/json` on v2; `encoding/json/v2` is stricter by default.

## Further reading

- [Package encoding/json](https://pkg.go.dev/encoding/json)
- [Package encoding/json/v2](https://pkg.go.dev/encoding/json/v2)
- [encoding/json/v2 migration guide](https://go.dev/doc/jsonv2-migration)
- [Go by Example: JSON](https://gobyexample.com/json)
