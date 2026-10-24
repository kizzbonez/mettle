---
title: Pointers
summary: Take a variable's address with &, follow a pointer with *, let functions change the caller's values and structs, return a pointer or nil, avoid the nil pointer panic, fill optional fields with Go 1.26's new(expr), and decide when a pointer is the right choice.
minutes: 35
objectives:
  - Use & and * to share a variable, and read the pointer type *T
  - Write functions that change the caller's value or struct through a pointer
  - Return a pointer or nil, check for nil, and recognise the nil pointer dereference panic
  - Create pointers with new(T) and new(expr), and choose between a pointer and a value
---

## Outline

1. Every variable has an address
2. Letting a function change your value
3. Returning a pointer, or nil
4. The nil pointer panic
5. new, and new with a value
6. Pointer or value?

## Every variable has an address

Lesson 12 ended with a problem: a function that receives a struct gets a copy, so it cannot change
the caller's struct. The way out is to pass the function the place where the value lives instead
of the value.

Every variable is stored somewhere in memory, at an **address**. The **address operator** `&`
gives you that address as a **pointer**. A pointer to an `int` has the **pointer type** `*int`.
Putting `*` in front of a pointer **dereferences** it: `*p` is the variable it points to, both for
reading and for writing.

```go
package main

import "fmt"

func main() {
	score := 7
	p := &score
	fmt.Printf("%T %v\n", p, *p)
	*p = 9
	fmt.Println(score)
	*p += 1
	fmt.Println(score, p == &score)
	fmt.Println(p)
}
```

```text
*int 7
9
10 true
0xc000018108
```

`p` and `score` are two names for one integer: writing through `*p` changed `score`. Two pointers
are equal when they point to the same variable. Printed, a pointer is a hexadecimal address that
differs from run to run. In a type, `*int` means "pointer to int"; in an expression, `*p` means
"the variable p points to".

Go has no **pointer arithmetic**: a pointer cannot be moved to the next address, so it always
points to a whole, valid variable. In a program that tries, `p++` does not compile:

```text
./main.go:6:2: invalid operation: p++ (non-numeric type *int)
```

## Letting a function change your value

A function that takes a `*Booking` can change the caller's booking, because the copy it receives
is a copy of the address, and both addresses lead to the same struct:

```go
package main

import "fmt"

type Booking struct {
	Name   string
	Kayaks int
	Hours  int
}

func extend(b *Booking, hours int) {
	b.Hours += hours // the same as (*b).Hours += hours
}

func main() {
	b := Booking{Name: "Cy", Kayaks: 1, Hours: 1}
	extend(&b, 2)
	fmt.Println(b.Hours)

	p := &Booking{Name: "Dee", Kayaks: 2, Hours: 1}
	extend(p, 1)
	fmt.Println(p.Hours, *p)
	fmt.Println(p)
}
```

```text
3
2 {Dee 2 2}
&{Dee 2 2}
```

Compare lesson 12, where `extend(b, 2)` left one hour. A field selector **dereferences
automatically**: with `b` a `*Booking`, `b.Hours` means `(*b).Hours`. `&Booking{...}` takes the
address of a new struct literal directly, and `fmt` prints a pointer to a struct as `&` and the
fields. The caller has to write `&b`, so the call itself tells the reader that `b` may change.

## Returning a pointer, or nil

The zero value of a pointer type is **nil**: a pointer to nothing. A function that looks something
up can return a pointer to what it found, or `nil` when it found nothing. Since the pointer leads
into the caller's slice, the caller can change the element through it:

```go
package main

import "fmt"

type Booking struct {
	Name  string
	Hours int
}

// find returns the booking for name, or nil if there is none.
func find(bookings []Booking, name string) *Booking {
	for i := range bookings {
		if bookings[i].Name == name {
			return &bookings[i]
		}
	}
	return nil
}

func main() {
	day := []Booking{{Name: "Ada", Hours: 1}, {Name: "Bo", Hours: 2}}
	if b := find(day, "Bo"); b != nil {
		b.Hours++
	}
	fmt.Println(day)

	b := find(day, "Zed")
	fmt.Println(b == nil)
	fmt.Println(b.Hours)
}
```

`&bookings[i]` points at the element itself, unlike `&b` for a range variable `b`, which would
point at a copy. Returning the address of a local variable is safe as well: Go keeps the variable
alive as long as something points to it.

## The nil pointer panic

The last line of that program follows a nil pointer, and there is no booking there to read:

```text
[{Ada 1} {Bo 3}]
true
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x0 pc=0x4e3d76]

goroutine 1 [running]:
main.main()
	/work/main.go:29 +0x2d6
```

The compiler cannot catch this, because whether `b` is nil depends on the data. A function that can
return nil says so in its comment, and every caller checks `!= nil` before using the result, as
the `if` above does.

## new, and new with a value

The built-in `new(T)` creates a variable of type `T` set to its zero value and returns a pointer to
it, so `new(int)` is a `*int` pointing at 0. Since Go 1.26, `new` also accepts an expression and
starts the variable at that value: `new(12)` is a `*int` pointing at 12.

That matters for **optional values**. A field of type `*int` can be nil to mean "no value yet",
which a plain `int` cannot express, since 0 may be a real value. Before Go 1.26, filling such a
field needed a temporary variable, because a constant has no address: `&12` fails with `invalid
operation: cannot take address of 12 (untyped int constant)`.

```go
package main

import "fmt"

type Entry struct {
	Name     string
	Handicap *int // nil when the player has no handicap yet
}

func describe(e Entry) string {
	if e.Handicap == nil {
		return e.Name + ": no handicap"
	}
	return fmt.Sprintf("%s: handicap %d", e.Name, *e.Handicap)
}

func main() {
	zero := new(int)
	fmt.Println(*zero)

	ada := Entry{Name: "Ada", Handicap: new(12)}
	scratch := Entry{Name: "Bo", Handicap: new(0)}
	newcomer := Entry{Name: "Cy"}
	fmt.Println(describe(ada))
	fmt.Println(describe(scratch))
	fmt.Println(describe(newcomer))
}
```

```text
0
Ada: handicap 12
Bo: handicap 0
Cy: no handicap
```

An untyped constant gets its default type (`new(12)` is `*int`; write `new(int64(300))` for
another type). Any expression works, such as `new(len(games))` or a function call, but not `nil`:
`use of untyped nil in argument to new`.

## Pointer or value?

Use a pointer when:

- a function must change the caller's variable or struct (`extend(&b, 2)`);
- you need "no value" as well as every real value (a nil `*int`);
- a function hands back one element of a collection to be changed (`find`).

Use a value otherwise. Small structs are cheap to copy, a copy cannot be changed behind your back,
and a value is never nil. Pass a pointer to save copying only for large structs, after measuring.
Slices and maps already share their data (lessons 10 and 11), so you rarely need a pointer to
either.

You never free memory yourself: the **garbage collector** reclaims a variable once nothing points
to it. When a pointer outlives its function, the compiler simply keeps the variable on the
longer-lived heap instead of the function's stack (`go build -gcflags=-m` reports `moved to heap:
n`).

## Common mistakes

- **Following a nil pointer.** `panic: runtime error: invalid memory address or nil pointer
  dereference`. Check `p != nil` whenever a pointer can be nil.
- **Forgetting `&`.** `extend(b, 2)` with `b` a `Booking` fails: `cannot use b (variable of struct
  type Booking) as *Booking value in argument to extend`. Pass `&b`.
- **Pointing at a range copy.** `for _, b := range day { return &b }` returns the address of a copy,
  so changes never reach the slice. Use `&day[i]`.
- **Pointers everywhere.** A `*int` for every number makes code harder to read and adds nil checks.
  Use pointers for the three reasons above.

## Practice

1. Write `swap(a, b *int)`, which swaps two integers.
2. For `type Player struct{ Name string; Best *int }`, write `record(p *Player, score int)`, which
   stores the score as the best when there is no best yet or the score beats it.
3. What does this print? `n := 5; p := &n; q := p; *q = 6; fmt.Println(n, *p)`

### Answers

```go
package main

import "fmt"

type Player struct {
	Name string
	Best *int // nil until the first game
}

func swap(a, b *int) {
	*a, *b = *b, *a
}

func record(p *Player, score int) {
	if p.Best == nil || score > *p.Best {
		p.Best = new(score)
	}
}

func main() {
	x, y := 1, 2
	swap(&x, &y)
	fmt.Println(x, y)

	ada := Player{Name: "Ada"}
	fmt.Println(ada.Best == nil)
	record(&ada, 150)
	record(&ada, 120)
	record(&ada, 190)
	fmt.Println(*ada.Best)

	n := 5
	p := &n
	q := p
	*q = 6
	fmt.Println(n, *p)
}
```

```text
2 1
true
190
6 6
```

`p` and `q` hold the same address. The `||` in `record` short-circuits (lesson 04), so `*p.Best`
is never read while `Best` is nil.

## Key takeaways

- `&x` is the address of `x`; `*p` is the variable that `p` points to; `*T` is "pointer to T".
- Pass `&v` when a function must change `v`; field access through a struct pointer is automatic.
- The zero value of a pointer is `nil`; dereferencing nil panics, so check first.
- `new(T)` points at a zero `T`; Go 1.26's `new(expr)` points at a copy of a value.
- Prefer values; use pointers to change, to express "no value", or to hand out an element.
- No pointer arithmetic, no manual freeing: the garbage collector does that.

## Further reading

- [The Go Programming Language Specification: Pointer types](https://go.dev/ref/spec#Pointer_types)
- [Go 1.26 Release Notes: changes to the language](https://go.dev/doc/go1.26#language)
- [A Tour of Go: Pointers](https://go.dev/tour/moretypes/1)
- [Go by Example: Pointers](https://gobyexample.com/pointers)
