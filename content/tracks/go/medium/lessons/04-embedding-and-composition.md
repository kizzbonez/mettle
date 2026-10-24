---
title: Embedding and Composition
summary: Build types out of other types by embedding them, use promoted fields and methods, override a method without inheritance, share state through an embedded pointer, combine interfaces, decorate one method of an interface, and use Go 1.27's promoted-field keys in struct literals.
minutes: 40
objectives:
  - Embed a struct and use its promoted fields and methods, and explain how promotion changes the method set
  - Override a promoted method, and explain why embedding is not inheritance
  - Embed interfaces in interfaces and an interface in a struct to change one method
  - Write struct literals with promoted-field keys in Go 1.27 and read the errors for the cases it rejects
---

## Outline

1. Embedding a struct
2. Struct literals with promoted fields (Go 1.27)
3. Overriding a method, which is not inheritance
4. Embedding a pointer
5. Name clashes at the same depth
6. Embedding interfaces
7. Composition over inheritance

## Embedding a struct

A struct field declared with a type and no name is an **embedded field**. Its type name doubles
as the field name, and its fields and methods are **promoted**: you can use them as if the outer
struct declared them.

```go
type Address struct {
	Street string
	City   string
}

func (a Address) Label() string {
	return a.Street + ", " + a.City
}

type Supplier struct {
	Name string
	Address
}

func main() {
	s := Supplier{
		Name:    "Fenwick Flour",
		Address: Address{Street: "4 Mill Lane", City: "Leeds"},
	}
	fmt.Println(s.City, "|", s.Address.City)
	fmt.Println(s.Label())
	s.City = "York"
	fmt.Printf("%+v\n", s)
}
```

```text
Leeds | Leeds
4 Mill Lane, Leeds
{Name:Fenwick Flour Address:{Street:4 Mill Lane City:York}}
```

`s.City` is short for `s.Address.City`; both names reach the same field, as `%+v` shows. The
`Address` is stored inside the `Supplier`, not shared. Promoted methods join the outer type's
method set, so `Supplier` now satisfies any interface that `Address` satisfies, such as one with
`Label() string`. The receiver kind still counts: methods with a `*Address` receiver are promoted
to `*Supplier` only, not to a `Supplier` value.

## Struct literals with promoted fields (Go 1.27)

Up to Go 1.26, a struct literal could only name the struct's own fields, so the embedded
`Address` had to be written out as above. Since Go 1.27 a key may be any field selector of the
struct, which includes promoted fields. Here `Depot` is `struct { Code string; Supplier }`:

```go
s := Supplier{Name: "Fenwick Flour", Street: "4 Mill Lane", City: "Leeds"}
fmt.Printf("%+v\n", s)
d := Depot{Code: "D1", City: "Hull", Name: "Hull depot"}
fmt.Printf("%+v\n", d)
```

```text
{Name:Fenwick Flour Address:{Street:4 Mill Lane City:Leeds}}
{Code:D1 Supplier:{Name:Hull depot Address:{Street: City:Hull}}}
```

In a `Depot`, `City` is promoted two levels deep and still works as a key. Three rules remain,
each with its own error:

```text
./main.go:35:57: cannot specify promoted field City and enclosing embedded field Address
./main.go:35:29: invalid implicit pointer indirection to reach City
./main.go:35:16: invalid field name Address.City in struct literal
```

The first is `Supplier{Address: Address{...}, City: "Leeds"}`: a key may not set a field inside
an embedded struct that another key also sets. The second comes from a struct that embeds
`*Address`: the literal cannot reach through a pointer, which may be nil. The third shows that a
key is a plain name, never a dotted path. Positional literals are unchanged. The feature depends
on the `go` line in go.mod: with `go 1.26`, the first literal fails with `use of promoted field
Address.Street in struct literal of type Supplier requires go1.27 or later (-lang was set to
go1.26; check go.mod)`.

## Overriding a method, which is not inheritance

If the outer type declares a method with the same name as a promoted one, the outer method wins,
because a selector picks the name at the shallowest **depth**. The inner method is still there
under its full name:

```go
type Item struct {
	Name  string
	Pence int
}

func (i Item) Price() int {
	return i.Pence
}

func (i Item) Line() string {
	return fmt.Sprintf("%s: %d", i.Name, i.Price())
}

type SaleItem struct {
	Item
	Off int
}

func (s SaleItem) Price() int {
	return s.Item.Price() - s.Off
}

func main() {
	kettle := SaleItem{Item: Item{Name: "kettle", Pence: 3000}, Off: 500}
	fmt.Println(kettle.Price(), kettle.Item.Price())
	fmt.Println(kettle.Line())
}
```

```text
2500 3000
kettle: 3000
```

`kettle.Line()` shows the full price. A promoted method runs with the **inner** value as its
receiver: `Line` is `kettle.Item.Line()`, and inside it `i` is an `Item`, whose `Price` is
`Item.Price`. The `Item` does not know it sits inside a `SaleItem`. In languages with
inheritance, `Line` would call the subclass's `Price`; in Go it never does. Neither is a
`SaleItem` an `Item`: `var it Item = kettle` fails with `cannot use kettle (variable of struct
type SaleItem) as Item value in variable declaration`. When code must work with both, give it an
interface such as `interface{ Price() int }`, which both satisfy.

## Embedding a pointer

Embedding `*T` promotes the same fields and methods, but the outer struct holds only a pointer,
so several values can share one inner value:

```go
type Counter struct {
	n int
}

func (c *Counter) Inc() {
	c.n++
}

type Door struct {
	Name string
	*Counter
}

func main() {
	visits := &Counter{}
	front := Door{Name: "front", Counter: visits}
	side := Door{Name: "side", Counter: visits}
	front.Inc()
	side.Inc()
	side.Inc()
	fmt.Println(visits.n, front.n)
}
```

```text
3 3
```

The pointer must be set before use: on `Door{Name: "back"}`, `Inc` panics with `runtime error:
invalid memory address or nil pointer dereference`.

## Name clashes at the same depth

Two embedded types may promote the same name. That is legal until you use the name:

```go
type Phone struct{ Number string }

type Fax struct{ Number string }

type Contact struct {
	Name string
	Phone
	Fax
}
```

`c.Number` on a `Contact` is `./main.go:19:16: ambiguous selector c.Number`, and in a literal
`Number` is `unknown field Number in struct literal of type Contact`. Write `c.Phone.Number`,
or declare `Number` on `Contact`, which is shallower and so wins.

## Embedding interfaces

An interface may embed other interfaces; its method set is the union. Package `io` builds its
larger interfaces this way:

```go
type ReadWriter interface {
	Reader
	Writer
}
```

A struct may embed an interface too. The struct then has all the interface's methods, delegating
to whatever value fills the field, and you override only the one you want to change. The `sort`
package's `Reverse` works exactly so: `sort.Sort` sorts any `sort.Interface` (`Len`, `Less`,
`Swap`), `sort.IntSlice` gives an `[]int` those methods, and the wrapper flips `Less`:

```go
type reverse struct {
	sort.Interface
}

func (r reverse) Less(i, j int) bool {
	return r.Interface.Less(j, i)
}

func main() {
	queue := []int{42, 7, 19}
	sort.Sort(reverse{sort.IntSlice(queue)})
	fmt.Println(queue)
}
```

```text
[42 19 7]
```

`Len` and `Swap` are promoted from the embedded value; only `Less` changed.

## Composition over inheritance

Go has no classes and no subclassing. You build a type by **composition**: put the parts in it,
as named fields or embedded ones, and describe what callers need as small interfaces. Embedding is
a shortcut that forwards calls for you, not an "is-a" relationship. Embed when the outer type
really offers the inner type's whole API (a `Supplier` really has an address); use a named field
when you want only some of it, because every promoted method becomes part of your type's API.

## Common mistakes

- **Expecting a promoted method to call your override.** `kettle.Line()` printed `kettle: 3000`.
  Override `Line` as well, or pass the behaviour in through an interface.
- **A nil embedded pointer.** `Door{Name: "back"}.Inc()` panics. Set it in a constructor.
- **Mixing a promoted key with its embedded struct.** `cannot specify promoted field City and
  enclosing embedded field Address`. Use one or the other.
- **Assuming a Go 1.27 feature works everywhere.** A module with `go 1.26` in go.mod rejects
  promoted keys. Raise the `go` line only when every user has Go 1.27.

## Practice

1. Give `SaleItem` its own `Line` so that the kettle prints `kettle: 2500 (was 3000)`.
2. Write `countingWriter`, a struct that embeds an `io.Writer`, overrides `Write` to count the
   bytes written, and passes them on. Use it with `os.Stdout`.
3. Put an `Item` and the kettle in one `[]Pricer`, where `type Pricer interface{ Price() int }`,
   and add up their prices.

### Answers

```go
func (s SaleItem) Line() string {
	return fmt.Sprintf("%s: %d (was %d)", s.Name, s.Price(), s.Item.Price())
}

type countingWriter struct {
	io.Writer
	bytes int
}

func (c *countingWriter) Write(p []byte) (int, error) {
	n, err := c.Writer.Write(p)
	c.bytes += n
	return n, err
}
```

`fmt.Fprintln(cw, ...)` twice, with `cw := &countingWriter{Writer: os.Stdout}`, then the bytes,
and the total of a mug at 800 and the kettle:

```text
kettle: 2500 (was 3000)
two flat whites
one croissant
30
3300
```

## Key takeaways

- An embedded field promotes its fields and methods; the full path `s.Address.City` still works.
- Since Go 1.27, literal keys may name promoted fields, but not through pointers, not overlapping
  their embedded struct, and not as dotted paths.
- An outer method hides the inner one, but promoted methods run on the inner value: no virtual
  calls, and the outer type is not the inner type.
- Embed a pointer to share one inner value; set it before use.
- Interfaces embed interfaces; a struct embedding an interface can change one method.
- Compose types from parts and small interfaces; embed only when the whole API belongs.

## Further reading

- [The Go Programming Language Specification: Struct types](https://go.dev/ref/spec#Struct_types)
- [Go 1.27 Release Notes: Changes to the language](https://go.dev/doc/go1.27#language)
- [Effective Go: Embedding](https://go.dev/doc/effective_go#embedding)
- [Go by Example: Struct Embedding](https://gobyexample.com/struct-embedding)
