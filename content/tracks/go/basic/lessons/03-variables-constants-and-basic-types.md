---
title: Variables, Constants and Basic Types
summary: Store values in variables declared with var and :=, rely on zero values, meet Go's basic types and type inference, swap values in one assignment, declare constants and enumerations with iota, and learn how names and scope work.
minutes: 35
objectives:
  - Declare variables with var and with :=, and say where each form is allowed
  - State the zero value of int, float64, string and bool, and name Go's basic types
  - Declare typed and untyped constants and number them with iota
  - Explain "declared and not used", the blank identifier, block scope and shadowing
---

## Outline

1. Variables with var
2. Short declarations with :=
3. Zero values
4. Basic types and type inference
5. Assigning several variables at once
6. Unused variables and the blank identifier
7. Constants
8. Enumerations with iota
9. Names
10. Scope and shadowing

## Variables with var

A **variable** is a named place that holds a value, which can change while the program runs. A
**declaration** creates it:

```go
package main

import "fmt"

func main() {
	var riders int = 4
	var station = "Harbour Gate"
	var open bool
	fmt.Println(riders, station, open)

	riders = riders + 2
	fmt.Println(riders)
}
```

```text
4 Harbour Gate false
6
```

`var riders int = 4` gives the name, the **type** and the first value. You may leave out the type
(`station`) or the value (`open`), but not both. A plain `=` **assigns** a new value to a variable
that already exists: the right side is worked out first, so `riders = riders + 2` turns 4 into 6.

## Short declarations with :=

Inside a function, the usual way to declare a variable is the **short variable declaration**:

```go
docks := 12
fare := 1.5
city := "Lisbon"
fmt.Println(docks, fare, city)
```

```text
12 1.5 Lisbon
```

`:=` declares and assigns in one step. It works only inside functions. At the top level of a file,
outside every function, write `var`; there, `stations := 8` gives `./main.go:5:1: syntax error:
non-declaration statement outside function body`. Variables declared at the top level are
**package-level variables**: every function in the package can use them.

## Zero values

A variable declared without a value is not garbage: it holds its type's **zero value**.

```go
package main

import "fmt"

func main() {
	var bikes int
	var price float64
	var name string
	var docked bool
	fmt.Println(bikes, price, docked)
	fmt.Println(name == "")
}
```

```text
0 0 false
true
```

The zero value is `0` for numbers, `""` (the empty string) for strings and `false` for booleans.
Go code relies on this: a counter declared with `var count int` is ready to use.

## Basic types and type inference

- `int`: whole numbers, such as `12` or `-3`.
- `float64`: numbers with a fraction, such as `1.5`.
- `string`: text, such as `"Lisbon"`.
- `bool`: `true` or `false`.

Others exist for special needs: `int8`, `int16`, `int32`, `int64`, `uint` (no negative values),
`uint8` to `uint64`, `float32`, and two aliases, `byte` for `uint8` and `rune` for `int32`.
Lessons 4 and 5 use them.

When you leave out the type, the compiler **infers** it from the value: `12` gives `int`, `1.5`
gives `float64`. The type then never changes, and Go never mixes types by itself:

```go
fare := 1.5
rides := 3
total := fare * rides
```

```text
./main.go:8:11: invalid operation: fare * rides (mismatched types float64 and int)
```

Lesson 4 shows how to convert one type to another.

## Assigning several variables at once

Both `:=` and `=` accept several names and values, matched from left to right. All the values on
the right are worked out before any variable changes, so swapping needs no temporary variable:

```go
morning, evening := "Ana", "Rui"
morning, evening = evening, morning
fmt.Println(morning, evening)
```

```text
Rui Ana
```

## Unused variables and the blank identifier

A local variable that is declared but never used is a compile error, not a warning:

```go
bikes := 12
broken := 3
fmt.Println(bikes)
```

```text
./main.go:7:2: declared and not used: broken
```

Unused variables often hide a bug, such as a value you meant to print. When you must receive a
value you do not need, assign it to the **blank identifier** `_`, which throws it away. Lessons 4
and 5 meet functions that return two or three values, where `_` skips the ones you do not want.

## Constants

A **constant** is a value fixed when the program is compiled. Declare it with `const`:

```go
package main

import "fmt"

const docksPerStation = 12
const fare = 1.5
const minutesPerDay = 24 * 60

func main() {
	stations := 8
	fmt.Println(stations * docksPerStation)
	fmt.Println(fare * docksPerStation)
	fmt.Println(minutesPerDay)
}
```

```text
96
18
1440
```

`24 * 60` is a **constant expression**: the compiler works it out. A constant can never be
assigned to: `fare = 2` gives `cannot assign to fare (neither addressable nor a map index
expression)`.

These constants are **untyped**: they are exact numbers that take on a type only where they are
used. That is why `fare * docksPerStation` mixes 1.5 and 12 without complaint. Give a constant a
type, as in `const docks int = 12`, and it follows the same rules as an `int` variable:
`docks * 1.5` gives `1.5 (untyped float constant) truncated to int`. Prefer untyped constants
unless the type matters.

## Enumerations with iota

An **enumeration** is a set of related named numbers. Inside a `const ( ... )` group, `iota`
counts the lines from 0, and a line with no value repeats the expression above it:

```go
package main

import "fmt"

const (
	small = iota
	medium
	large
)

const (
	_ = iota
	bronze
	silver
	gold
)

func main() {
	fmt.Println(small, medium, large)
	fmt.Println(bronze, silver, gold)
}
```

```text
0 1 2
1 2 3
```

The second group throws away 0 with `_`, so the numbering starts at 1.

## Names

A name starts with a letter or `_` and may contain letters, digits and `_`; case matters, so
`fare` and `Fare` are different names. Keywords such as `func` and `var` cannot be names. Go
style uses **MixedCaps** for names of several words (`docksPerStation`, never
`docks_per_station`), short names for short-lived variables (`i`, `n`), and longer ones where a
name is used far from its declaration. A name that starts with a capital letter, such as `MaxRiders`, is **exported**:
other packages can use it (Medium 01 explains packages).

## Scope and shadowing

A name exists only inside the **block**, the `{ ... }`, where it is declared, from its declaration
on. That region is its **scope**. Declaring the same name again in an inner block creates a second,
separate variable that **shadows** the outer one:

```go
package main

import "fmt"

func main() {
	bikes := 12
	{
		bikes := 3
		spare := 1
		fmt.Println("inside:", bikes, spare)
	}
	fmt.Println("outside:", bikes)
}
```

```text
inside: 3 1
outside: 12
```

The inner `:=` did not change the outer `bikes`; using `spare` after the closing brace gives
`undefined: spare`. Lessons 7 and 8 show where this bites in real code.

## Common mistakes

- **`:=` for a variable that already exists.** `docks := 12` and then `docks := 14` in the same
  block gives `no new variables on left side of :=`. Use `=` to change it.
- **The wrong type of value.** `var docks int = "12"` gives `cannot use "12" (untyped string
  constant) as int value in variable declaration`. Quotes make a string.
- **Shadowing by accident.** `:=` in an inner block makes a new variable, so the outer one keeps
  its old value without any error. Use `=` when you mean the outer variable.
- **Leaving variables unused.** `declared and not used` stops the build. Use the variable, or
  delete it.

## Practice

1. What does this print?

   ```go
   var spares int
   var note string
   price := 2.5
   fmt.Println(spares, note == "", price)
   ```
2. With `a, b, c := "x", "y", "z"`, write one assignment that moves every value one place to the
   left, so that `a` holds `"y"` and `c` holds `"x"`.
3. Declare `monday`, `tuesday` and `wednesday` as 1, 2 and 3 with `iota`.

### Answers

```go
package main

import "fmt"

const (
	monday = iota + 1
	tuesday
	wednesday
)

func main() {
	var spares int
	var note string
	price := 2.5
	fmt.Println(spares, note == "", price)

	a, b, c := "x", "y", "z"
	a, b, c = b, c, a
	fmt.Println(a, b, c)
	fmt.Println(monday, tuesday, wednesday)
}
```

```text
0 true 2.5
y z x
1 2 3
```

`tuesday` and `wednesday` repeat `iota + 1` with `iota` at 1 and 2.

## Key takeaways

- `var name type = value` works everywhere; `name := value` only inside functions.
- Variables start at their zero value: `0`, `""` or `false`.
- The basic types are `int`, `float64`, `string` and `bool`; an inferred type never changes.
- `a, b = b, a` swaps; unused local variables are errors; `_` discards a value.
- Constants are fixed at compile time; untyped ones take their type from where they are used;
  `iota` numbers enumerations.
- MixedCaps names; a capital first letter exports. An inner `:=` shadows the outer variable.

## Further reading

- [The Go Programming Language Specification: Declarations and scope](https://go.dev/ref/spec#Declarations_and_scope)
- [Effective Go: Constants](https://go.dev/doc/effective_go#constants)
- [Go by Example: Variables](https://gobyexample.com/variables)
- [Go by Example: Constants](https://gobyexample.com/constants)
