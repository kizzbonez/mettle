---
title: Methods and Receivers
summary: Attach methods to your own types, choose between value and pointer receivers, see when Go takes the address for you and when it cannot, give slice types methods, and control how fmt prints a type with a String method.
minutes: 35
objectives:
  - Declare methods on struct types and on other named types such as type Celsius float64
  - Choose a value or a pointer receiver for a method, and apply the consistency rule
  - Explain method sets and the automatic & on addressable values, and read the error when a value is not addressable
  - Write a String method that fmt uses, and avoid the pointer-receiver and recursion traps
---

## Outline

1. Declaring a method
2. Value receivers work on a copy
3. Pointer receivers, and the & that Go adds
4. Method sets in plain words
5. Methods on slice types
6. Constructors and the consistency rule
7. The String method
8. Nil receivers

## Declaring a method

A **method** is a function with a **receiver**: an extra parameter, written before the name,
that ties the function to a type. You have used methods since Basic: `strings.Builder`'s
`WriteString` and `bufio.Scanner`'s `Scan` are methods. Now you write your own:

```go
package main

import "fmt"

type Celsius float64

func (c Celsius) Fahrenheit() float64 {
	return float64(c)*9/5 + 32
}

func main() {
	oven := Celsius(180)
	fmt.Println(oven.Fahrenheit())
	fmt.Println(Celsius(-40).Fahrenheit())
}
```

```text
356
-40
```

`c` is the receiver, and `oven.Fahrenheit()` passes `oven` as `c`. Any named type declared in
your package can have methods: structs, numbers, slices, maps, functions, but not pointer or
interface types. A type from another
package cannot, because its methods belong to its own package; `func (n int) Double() int` is
`./main.go:5:9: cannot define new methods on non-local type int`. Methods do what functions can,
but they keep the operations next to their type, they read naturally (`tab.Add(350)` rather than
`addToTab(&tab, 350)`), and, as the next lesson shows, they let a type satisfy an interface.

Name the receiver with one or two letters taken from the type (`c` for `Celsius`, `t` for `Tab`),
the same in every method. Never `this` or `self`.

## Value receivers work on a copy

A receiver is a parameter, and Go passes parameters by value. A **value receiver** therefore gets
a copy of the struct, and changes to the copy are lost:

```go
package main

import "fmt"

type Tab struct {
	Table int
	Cents int
}

func (t Tab) addToCopy(cents int) {
	t.Cents += cents
}

func (t *Tab) Add(cents int) {
	t.Cents += cents
}

func main() {
	tab := Tab{Table: 4}
	tab.addToCopy(350)
	fmt.Println(tab.Cents)
	tab.Add(350)
	tab.Add(275)
	fmt.Println(tab.Cents)
}
```

```text
0
625
```

`addToCopy` compiles and runs, and changes nothing: the same trap as passing a struct to a
function in Basic 12. `Add` has a **pointer receiver**, `*Tab`, so `t` points at the caller's
`tab`, and `t.Cents` is shorthand for `(*t).Cents`.

## Pointer receivers, and the & that Go adds

`tab.Add(350)` works although `tab` is a `Tab`, not a `*Tab`. When a variable is **addressable**
(it has a place in memory you could take with `&`), Go turns `tab.Add(350)` into
`(&tab).Add(350)` for you. Variables, struct fields reached through them, slice elements and
`*p` are addressable. A map element is not, because a map may move its elements as it grows, and
neither is a struct literal or a function's result:

```go
tabs := map[int]Tab{4: {Table: 4}}
tabs[4].Add(100)
Tab{Table: 2}.Add(100)
```

```text
./main.go:14:10: cannot call pointer method Add on Tab
./main.go:15:16: cannot call pointer method Add on Tab
```

The fix for a map is to store pointers, `map[int]*Tab`, or to copy the element out, change it and
store it back. In the other direction, a pointer can always call a value method: for a
`p := &oven`, `p.Fahrenheit()` becomes `(*p).Fahrenheit()`.

## Method sets in plain words

The **method set** of a type is the list of methods its values have. A `Tab` value has the
methods with a `Tab` receiver. A `*Tab` has those and the methods with a `*Tab` receiver. The
automatic `&` hides the difference while you call methods on variables; you meet it again when a
value is not addressable, as above, and in the next lesson, where only a type whose method set
holds an interface's methods satisfies that interface.

Choose a pointer receiver when the method changes the receiver, when the struct is large, or when
it holds something that must not be copied (Advanced 04 shows mutexes). Choose a value receiver
for small values that the methods only read, such as `Celsius` or a two-field point.

## Methods on slice types

A named slice type can have methods too. `Total` only reads, so a value receiver is enough, but
`Add` uses `append`, which may return a new slice, so it must change the caller's variable:

```go
type Item struct {
	Name  string
	Cents int
}

type Order []Item

func (o Order) Total() int {
	total := 0
	for _, item := range o {
		total += item.Cents
	}
	return total
}

func (o *Order) Add(name string, cents int) {
	*o = append(*o, Item{Name: name, Cents: cents})
}
```

With `var order Order`, then `order.Add("flat white", 340)` and `order.Add("croissant", 290)`,
`fmt.Println(len(order), order.Total())` prints:

```text
2 630
```

## Constructors and the consistency rule

A **constructor** is a plain function, by convention `NewX`, that returns a ready-to-use value,
usually a pointer when the type has pointer methods: `func NewTab(table int) *Tab { return
&Tab{Table: table} }`. It is the place to fill in maps and defaults the zero value lacks.

If any method of a type needs a pointer receiver, give all of its methods pointer receivers, even
the ones that only read. Then every method works on the same shared value, and the method set of
`*Tab` is the whole API. The `Tab` above, with a value `addToCopy` next to a pointer `Add`, breaks
this rule on purpose.

## The String method

`fmt` checks whether a value has a method `String() string`, and prints its result instead of the
fields. A type with that method satisfies the interface **`fmt.Stringer`**; the next lesson
explains interfaces. The receiver type matters:

```go
func (t *Tab) String() string {
	return fmt.Sprintf("table %d owes %d.%02d", t.Table, t.Cents/100, t.Cents%100)
}

func main() {
	tab := NewTab(7)
	tab.Add(340)
	tab.Add(290)
	fmt.Println(tab)
	fmt.Println(*tab)
	fmt.Printf("%v | %s\n", tab, tab)
}
```

```text
table 7 owes 6.30
{7 630}
table 7 owes 6.30 | table 7 owes 6.30
```

`*tab` is a `Tab` value, and `String` is not in a `Tab`'s method set, so `fmt` prints the raw
fields. Types that are printed by value, such as `Celsius`, should have a value-receiver `String`.

## Nil receivers

A pointer-receiver method can be called on a nil pointer: the method runs with `t == nil`. It
may check for that and return something sensible, so that a nil `*Tab` means "no tab yet":

```go
func (t *Tab) Total() int {
	if t == nil {
		return 0
	}
	return t.Cents
}
```

With `var missing *Tab`, `missing.Total()` returns 0, but reading `missing.Cents` directly
panics with `panic: runtime error: invalid memory address or nil pointer dereference`.

## Common mistakes

- **A value receiver on a method that changes the struct.** It compiles, runs and prints `0`.
  Use `*T`.
- **A pointer-receiver `String` on a type printed by value.** `fmt.Println(*tab)` shows `{7
  630}`. Match the receiver to how the type is printed.
- **Printing the receiver inside its own `String`.** `fmt.Sprintf("tab %v", t)` calls `String`
  again, forever: the program dies with `fatal error: stack overflow`. `go vet` catches it:
  `main.go:11:26: fmt.Sprintf format %v with arg t causes recursive (example.Tab).String method
  call`. Format the fields instead.
- **Calling a pointer method on a map element.** `cannot call pointer method Add on Tab`. Store
  pointers in the map.

## Practice

1. Give `Celsius` a method `Kelvin() float64` (add 273.15).
2. Give `Order` a `String` method that prints `2 items, 6.30`. Which receiver should it have?
3. Write `(t *Tab) Pay(cents int)`, which takes a payment off the tab but never below 0.

### Answers

```go
func (c Celsius) Kelvin() float64 {
	return float64(c) + 273.15
}

func (o Order) String() string {
	total := o.Total()
	return fmt.Sprintf("%d items, %d.%02d", len(o), total/100, total%100)
}

func (t *Tab) Pay(cents int) {
	t.Cents -= cents
	if t.Cents < 0 {
		t.Cents = 0
	}
}
```

With `fmt.Println(Celsius(20).Kelvin())`, the two-item `order`, and a tab that owes 630 and pays
500 and then 500 again:

```text
293.15
2 items, 6.30
table 7 owes 1.30
table 7 owes 0.00
```

`Order.String` has a value receiver, like `Total`: it only reads, and an `Order` is printed by
value. `Pay` changes the tab, so it takes `*Tab`, like the other `Tab` methods.

## Key takeaways

- A method is a function with a receiver; any named type of your own package can have methods.
- A value receiver gets a copy; a pointer receiver changes the caller's value.
- Go adds `&` for addressable values; map elements, literals and results are not addressable.
- The method set of `T` holds the value-receiver methods; that of `*T` holds both kinds.
- If one method needs `*T`, give them all `*T`. Constructors `NewX` return ready values.
- `String() string` controls printing; mind its receiver, and never print the receiver inside it.

## Further reading

- [The Go Programming Language Specification: Method declarations](https://go.dev/ref/spec#Method_declarations)
- [Effective Go: Methods](https://go.dev/doc/effective_go#methods)
- [Go FAQ: Should I define methods on values or pointers?](https://go.dev/doc/faq#methods_on_values_or_pointers)
- [Go by Example: Methods](https://gobyexample.com/methods)
