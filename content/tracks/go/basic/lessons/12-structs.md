---
title: Structs
summary: Group related values into your own types with structs, build them with field names, print them with %+v, keep them in slices and maps, compare them, and see why passing a struct to a function hands over a copy.
minutes: 35
objectives:
  - Define a struct type, build values with keyed literals and read and set their fields
  - Store structs in slices and maps and change them there correctly
  - Compare structs with == and use anonymous structs for small tables
  - Explain why a function cannot change the caller's struct, and write constructor functions
---

## Outline

1. Defining a struct type
2. Struct literals: name the fields
3. Structs in structs, slices and maps
4. Anonymous structs and comparing structs
5. Structs are values
6. Constructor functions
7. New types from other types

## Defining a struct type

So far each value has been one number, one string or one collection. A kayak booking is several
values that belong together: a name, a number of kayaks, a number of hours, whether it is paid. A
**struct** groups named values, called **fields**, into one value. A **type definition** gives the
struct a name you can use like `int` or `string`:

```go
package main

import "fmt"

// Booking is one group's hire of kayaks at the boathouse.
type Booking struct {
	Name   string
	Kayaks int
	Hours  int
	Paid   bool
}

func main() {
	b := Booking{Name: "Ada", Kayaks: 2, Hours: 3}
	b.Paid = true
	fmt.Println(b.Name, b.Kayaks*b.Hours)
	fmt.Printf("%v\n%+v\n", b, b)

	var empty Booking
	fmt.Printf("%+v %q\n", empty, empty.Name)
}
```

```text
Ada 6
{Ada 2 3 true}
{Name:Ada Kayaks:2 Hours:3 Paid:true}
{Name: Kayaks:0 Hours:0 Paid:false} ""
```

A dot selects a field, to read it (`b.Name`) or to set it (`b.Paid = true`). `%v` prints the
field values in braces; `%+v` adds their names, which is far easier to read while debugging. A
struct declared without a value is the **zero-value struct**: every field holds its own zero value,
so a `Booking` is ready to use without any setup. Field names that start with a capital letter
are exported, as lesson 03 mentioned; Medium 01 explains what that means across packages.

## Struct literals: name the fields

`Booking{Name: "Ada", Kayaks: 2, Hours: 3}` is a **keyed struct literal**. Fields you leave out get
their zero value, and the order does not matter. Go also accepts a positional literal,
`Booking{"Ada", 2, 3, false}`, but then every field must be given, in order:

```go
	b := Booking{"Ada", 2, 3}
```

```text
./main.go:13:26: too few values in struct literal of type Booking
```

A positional literal also breaks, or silently swaps values, when someone adds or reorders a field,
and it does not say which number is the kayaks. Name the fields. `go vet` even reports positional
literals of most struct types from other packages (`net/url.Error struct literal uses unkeyed
fields`).

## Structs in structs, slices and maps

A field can hold any type, including another struct. Slices and maps of structs work like any
other slices and maps, and inside their literals the element type can be left out:

```go
package main

import "fmt"

type Address struct {
	Street, Town string
}

type Member struct {
	Name string
	Home Address
}

func main() {
	members := []Member{
		{Name: "Ada", Home: Address{Street: "1 Mill Lane", Town: "Bath"}},
		{Name: "Bo", Home: Address{Town: "Wells"}},
	}
	members[1].Home.Street = "4 Quay Road"
	fmt.Printf("%+v\n", members[1])

	for _, m := range members {
		m.Name = "changed"
	}
	fmt.Println(members[0].Name)
	for i := range members {
		members[i].Name += "!"
	}
	fmt.Println(members[0].Name, members[1].Name)

	byName := map[string]Member{"ada": members[0]}
	m := byName["ada"]
	m.Home.Town = "Frome"
	byName["ada"] = m
	fmt.Println(byName["ada"].Home.Town)
}
```

```text
{Name:Bo Home:{Street:4 Quay Road Town:Wells}}
Ada
Ada! Bo!
Frome
```

Two traps hide here. First, the `m` in `for _, m := range members` is a copy of each element, so
changing it changes nothing in the slice. To change the elements, loop over the indexes and write
`members[i].Name`. Second, a struct stored in a map cannot be changed in place:
`byName["ada"].Home.Town = "Frome"` does not compile.

```text
./main.go:14:2: cannot assign to byName["ada"].Home.Town (neither addressable nor a map index expression)
```

Read the struct out, change the copy, and store it back, as the program does.

## Anonymous structs and comparing structs

A struct type does not need a name. An **anonymous struct** suits data used in one place only, such
as a small table, and is common in tests:

```go
package main

import "fmt"

type Point struct {
	X, Y int
}

func main() {
	rates := []struct {
		hours int
		cents int
	}{
		{1, 1500},
		{3, 3500},
	}
	for _, r := range rates {
		fmt.Printf("%d h: %d cents\n", r.hours, r.cents)
	}

	a := Point{X: 1, Y: 2}
	fmt.Println(a == Point{1, 2}, a == Point{})
	visits := map[Point]int{}
	visits[a]++
	visits[Point{1, 2}]++
	fmt.Println(visits)
}
```

```text
1 h: 1500 cents
3 h: 3500 cents
true false
map[{1 2}:2]
```

Two structs of the same type are equal with `==` when all their fields are equal. That needs every
field to be comparable, so a struct is a valid map key (lesson 11) under the same condition: the
two `Point{1, 2}` keys above are one key. A struct with a slice field cannot be compared at all;
for two values `a` and `b` of a type with a field `Names []string`, `a == b` fails:

```text
./main.go:13:14: invalid operation: a == b (struct containing []string cannot be compared)
```

## Structs are values

Assigning a struct copies every field. Passing one to a function does the same: the function
works on its own copy.

```go
package main

import "fmt"

type Booking struct {
	Name   string
	Kayaks int
	Hours  int
	Paid   bool
}

// newBooking returns a booking for one hour, the usual hire.
func newBooking(name string, kayaks int) Booking {
	return Booking{Name: name, Kayaks: kayaks, Hours: 1}
}

func extend(b Booking, hours int) {
	b.Hours += hours
}

func extended(b Booking, hours int) Booking {
	b.Hours += hours
	return b
}

func main() {
	b := newBooking("Cy", 1)
	copyOfB := b
	copyOfB.Name = "Dee"
	extend(b, 2)
	fmt.Println(b.Name, b.Hours, copyOfB.Name)
	b = extended(b, 2)
	fmt.Println(b.Hours)
}
```

```text
Cy 1 Dee
3
```

`extend` changed its copy and threw it away, so the caller's booking still has one hour. For now,
a function that changes a struct must return the new value, as `extended` does, and the caller
must store it. Lesson 13 shows the other way: passing a pointer, so that the function can change
the caller's struct itself. Copying a struct with slice or map fields copies those fields, not the
data they share (lessons 10 and 11).

## Constructor functions

`newBooking` above is a **constructor function**: a function, by convention named `newX`, that
builds a valid value and fills in sensible defaults, here one hour. Write one when the zero value is
not a good start, or when several fields must agree; otherwise a literal is enough.

## New types from other types

A type definition can start from any type, not only a struct. `type Celsius float64` makes a new
type with the same values and operators as `float64`, but a different name, so the compiler stops
you mixing it up with other numbers:

```go
type Celsius float64

type Fahrenheit float64

func toFahrenheit(c Celsius) Fahrenheit {
	return Fahrenheit(c*9/5 + 32)
}
```

Called with `Celsius(12.5)` it returns 54.5. Called with a plain `float64` variable it fails:

```text
./main.go:17:27: cannot use air (variable of type float64) as Celsius value in argument to toFahrenheit
```

Convert on purpose with `Celsius(air)`. Medium 02 gives such types their own methods.

## Common mistakes

- **Changing the range copy.** `for _, b := range bookings { b.Paid = true }` leaves the slice
  unchanged. Use `bookings[i].Paid = true`.
- **Assigning to a field of a map element.** `cannot assign to struct field byName["ada"].Town in
  map`, or the longer message above for a nested field. Copy the struct out, change it, store it
  back.
- **Positional literals.** `too few values in struct literal`, or values in the wrong fields after
  a change. Name the fields.
- **Expecting a function to change your struct.** It changes a copy. Return the new struct, or wait
  for pointers in lesson 13.

## Practice

1. Define `Book` with `Title`, `Author` and `Pages`, and print one with `%+v`.
2. Write `longest(books []Book) Book`, which returns the book with the most pages, or the zero
   `Book` for an empty slice.
3. Store a book in a `map[string]Book` and change its pages in the map.
4. Is `Book{Title: "Dune"} == Book{Title: "Dune"}` true?

### Answers

```go
package main

import "fmt"

type Book struct {
	Title, Author string
	Pages         int
}

func longest(books []Book) Book {
	var best Book
	for _, b := range books {
		if b.Pages > best.Pages {
			best = b
		}
	}
	return best
}

func main() {
	shelf := []Book{
		{Title: "Emma", Author: "Austen", Pages: 474},
		{Title: "Dune", Author: "Herbert", Pages: 612},
	}
	fmt.Printf("%+v\n", shelf[0])
	fmt.Println(longest(shelf).Title, longest(nil) == Book{})

	loans := map[string]Book{"emma": shelf[0]}
	b := loans["emma"]
	b.Pages = 480
	loans["emma"] = b
	fmt.Println(loans["emma"].Pages, shelf[0].Pages)

	fmt.Println(Book{Title: "Dune"} == Book{Title: "Dune"})
}
```

```text
{Title:Emma Author:Austen Pages:474}
Dune true
480 474
true
```

The map holds its own copy, so `shelf[0]` keeps 474 pages.

## Key takeaways

- `type Name struct { ... }` groups named fields; the zero-value struct has every field at zero.
- Use keyed literals; `%+v` prints field names.
- `range` gives copies: change slice elements through their index; map elements by copy, change,
  store.
- Structs compare with `==` when all their fields are comparable, and then can be map keys.
- Structs are copied on assignment and when passed; a function returns the changed struct.
- `newX` constructors fill in defaults; `type Celsius float64` makes a distinct type.

## Further reading

- [The Go Programming Language Specification: Struct types](https://go.dev/ref/spec#Struct_types)
- [Effective Go: Composite literals](https://go.dev/doc/effective_go#composite_literals)
- [A Tour of Go: Structs](https://go.dev/tour/moretypes/2)
- [Go by Example: Structs](https://gobyexample.com/structs)
