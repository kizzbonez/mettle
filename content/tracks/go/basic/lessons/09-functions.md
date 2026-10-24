---
title: Functions
summary: Declare functions with parameters and results, return several values (a value plus ok or plus an error), use named results, variadic parameters, function values and types, anonymous functions and closures, recursion with a base case, and a first look at defer.
minutes: 40
objectives:
  - Declare and call functions with parameters and one or more results, and read the errors for wrong calls and missing returns
  - Return a value with an ok flag or an error, and explain why Go uses multiple results for this
  - Write variadic functions, pass functions as values, and build a closure that keeps its own state
  - Write a recursive function with a base case, and say when a deferred call runs
---

## Outline

1. Declaring and calling a function
2. Several results
3. Named results
4. Variadic parameters
5. Functions as values
6. Anonymous functions and closures
7. Recursion
8. defer, in brief
9. No default arguments, no overloading

## Declaring and calling a function

So far all your code has lived in `main`. A **function** is a named block of code that does one
job, so that you write it once and **call** it wherever it is needed:

```go
package main

import "fmt"

func fare(adults, children int) int {
	return adults*450 + children*200
}

func greet(name string) {
	fmt.Println("Welcome aboard,", name)
}

func main() {
	greet("Ada")
	fmt.Println(fare(2, 1))
	total := fare(1, 0) + fare(0, 3)
	fmt.Println(total)
}
```

```text
Welcome aboard, Ada
1100
1050
```

`adults` and `children` are **parameters**: variables that receive the **arguments** a caller
passes. Parameters of the same type can share it, as in `adults, children int`. The `int` after
the parentheses is the **result type**, and `return` hands the value back. `greet` has no result,
so it just ends. Every call is checked: `fare(2)` is
`not enough arguments in call to fare`, followed by `have (number)` and `want (int, int)`. A
function with a result must return on every path: an `if` / `else if` chain that can reach the
end of the function without a `return` is the compile error `missing return`.

A parameter is a copy of the argument: changing it inside the function leaves the caller's
variable as it was. Lesson 13 shows how pointers change that.

## Several results

A Go function can return more than one value. List the types in parentheses, and assign the
results to as many variables:

```go
package main

import (
	"fmt"
	"strconv"
)

func clock(minutes int) (int, int) {
	return minutes / 60, minutes % 60
}

func pier(stop string) (int, bool) {
	switch stop {
	case "Oban":
		return 1, true
	case "Craignure":
		return 3, true
	}
	return 0, false
}

func main() {
	h, m := clock(135)
	fmt.Printf("%02d:%02d\n", h, m)

	if p, ok := pier("Tobermory"); ok {
		fmt.Println("pier", p)
	} else {
		fmt.Println("no ferry to Tobermory")
	}

	n, err := strconv.Atoi("12x")
	fmt.Println(n, err)
}
```

```text
02:15
no ferry to Tobermory
0 strconv.Atoi: parsing "12x": invalid syntax
```

Two shapes are everywhere in Go. **Value plus ok**: a `bool` says whether the value means
anything, so the `0` of "no such pier" cannot pass for a real pier. **Value plus error**:
`strconv.Atoi` returns the number and an error that is `nil` when all went well. Instead of a
special value such as -1 or an exception, failure is an ordinary result that the caller sees and
handles (lesson 14).
You cannot keep only one result by accident: `h := clock(135)` is
`assignment mismatch: 1 variable but clock returns 2 values`. Use `_` for a result you do not want.

## Named results

Results may have names. They start at their zero values, and a `return` with nothing after it, a
**naked return**, returns their current values:

```go
package main

import (
	"fmt"
	"strings"
)

func splitName(full string) (first, last string) {
	first, last, _ = strings.Cut(full, " ")
	return
}

func main() {
	f, l := splitName("Ada Lovelace")
	fmt.Printf("%q %q\n", f, l)
	f, l = splitName("Plato")
	fmt.Printf("%q %q\n", f, l)
}
```

```text
"Ada" "Lovelace"
"Plato" ""
```

Names document what each result means, which helps when two results have the same type. Naked
returns are fine in a function this short. In a long one, the reader must search for what was
returned, so write `return first, last`.

## Variadic parameters

A last parameter written `...T` accepts any number of arguments, even none. Inside the function
it is a slice of `T` (lesson 10), so `range` goes through it. Such a function is **variadic**;
`fmt.Println` is one:

```go
package main

import "fmt"

func total(prices ...int) int {
	sum := 0
	for _, p := range prices {
		sum += p
	}
	return sum
}

func main() {
	fmt.Println(total(450, 200, 200))
	fmt.Println(total())
	day := []int{450, 450, 1200}
	fmt.Println(total(day...))
}
```

```text
850
0
2100
```

To pass values that are already in a slice, write the slice followed by `...`.

## Functions as values

A function is a value, like a number. Its **function type** lists its parameter and result
types: `half` has the type `func(int) int`. A function can be stored in a variable and passed to
another function:

```go
package main

import "fmt"

func half(cents int) int {
	return cents / 2
}

func withOffer(cents int, offer func(int) int) int {
	return offer(cents)
}

func main() {
	fmt.Println(withOffer(900, half))

	minus := func(cents int) int { return cents - 100 }
	fmt.Println(withOffer(900, minus))
	fmt.Println(withOffer(900, func(c int) int { return c * 9 / 10 }))

	fmt.Printf("%T\n", half)
	var none func(int) int
	fmt.Println(none == nil)
}
```

```text
450
800
810
func(int) int
true
```

`half` is passed without parentheses: the function itself, not its result. The zero value of a
function type is `nil`, and calling a nil function crashes the program.

## Anonymous functions and closures

`func(c int) int { ... }` above is an **anonymous function**, or function literal: a function
without a name, written where it is needed. When it uses variables of the function around it,
it keeps them alive, even after that function has returned. The literal and the variables it
captured form a **closure**:

```go
package main

import "fmt"

func newTicketCounter(prefix string) func() string {
	n := 0
	return func() string {
		n++
		return fmt.Sprintf("%s-%03d", prefix, n)
	}
}

func main() {
	oban := newTicketCounter("OBN")
	mull := newTicketCounter("MUL")
	fmt.Println(oban(), oban(), mull(), oban())
}
```

```text
OBN-001 OBN-002 MUL-001 OBN-003
```

Each call of `newTicketCounter` creates a new `n`, and only the function it returns can reach
it. A closure made inside a loop captures that iteration's own variable (lesson 08).

## Recursion

A function that calls itself is **recursive**. It needs a **base case**, an input it answers
without calling itself, and every other call must move towards it:

```go
package main

import "fmt"

func digitSum(n int) int {
	if n < 10 {
		return n
	}
	return n%10 + digitSum(n/10)
}

func main() {
	fmt.Println(digitSum(7), digitSum(2026), digitSum(99999))
}
```

```text
7 10 45
```

`digitSum(2026)` is `6 + digitSum(202)`, and so on down to `digitSum(2)`. Without a base case,
the calls go on until memory for them runs out: `fatal error: stack overflow`. A loop is usually
simpler in Go; recursion suits problems that are recursive by nature, such as trees.

## defer, in brief

`defer` before a call postpones it until the surrounding function returns. Several deferred
calls run in reverse order, last deferred first:

```go
package main

import "fmt"

func sail(route string) {
	defer fmt.Println("tie up at", route)
	defer fmt.Println("lower the ramp")
	fmt.Println("crossing to", route)
}

func main() {
	sail("Mull")
	fmt.Println("next sailing")
}
```

```text
crossing to Mull
lower the ramp
tie up at Mull
next sailing
```

You will use it to close files right after opening them (lesson 11); Medium 06 covers the rules.

## No default arguments, no overloading

Go has no default parameter values, and two functions in a package cannot share a name:
a second `func fare(adults int) int` is `fare redeclared in this block`. Give different jobs
different names (`fare`, `adultFare`), so that every call says exactly what it does.

## Common mistakes

- **Calling instead of passing.** `withOffer(900, half(900))` is `cannot use half(900) (value of
  type int) as func(int) int value in argument to withOffer`. Pass `half`.
- **Dropping the second result.** `assignment mismatch`; write `h, _ := clock(135)`.
- **Expecting a parameter to change the caller's variable.** After `addTip(bill)`, `bill` is
  unchanged. Return the new value instead: `bill = withTip(bill)`.
- **No base case.** `return countdown(n - 1)` with no stop ends in `fatal error: stack overflow`.

## Practice

1. Write `average(nums ...float64) (float64, bool)` that returns `false` when given no numbers.
2. Write `makeAdder(step int) func(int) int`. What is `makeAdder(10)(5)`?
3. Write a recursive `power(base, exp int) int` for `exp` of 0 or more.

### Answers

```go
package main

import "fmt"

func average(nums ...float64) (float64, bool) {
	if len(nums) == 0 {
		return 0, false
	}
	sum := 0.0
	for _, n := range nums {
		sum += n
	}
	return sum / float64(len(nums)), true
}

func makeAdder(step int) func(int) int {
	return func(n int) int {
		return n + step
	}
}

func power(base, exp int) int {
	if exp == 0 {
		return 1
	}
	return base * power(base, exp-1)
}

func main() {
	fmt.Println(average(4, 8, 9))
	fmt.Println(average())
	addTen := makeAdder(10)
	fmt.Println(addTen(5), addTen(addTen(1)))
	fmt.Println(power(2, 10), power(7, 0))
}
```

```text
7 true
0 false
15 21
1024 1
```

## Key takeaways

- `func name(a, b int) int { return ... }`; parameters are copies of the arguments.
- Several results are normal: value plus `ok`, or value plus `error`.
- Named results document; keep naked returns for short functions.
- `...T` collects any number of arguments into a slice; pass a slice with `s...`.
- Functions are values with types such as `func(int) int`; closures keep the variables they use.
- Recursion needs a base case. A deferred call runs when the function returns, last first.

## Further reading

- [The Go Programming Language Specification: Function declarations](https://go.dev/ref/spec#Function_declarations)
- [Effective Go: Functions](https://go.dev/doc/effective_go#functions)
- [Go by Example: Closures](https://gobyexample.com/closures)
