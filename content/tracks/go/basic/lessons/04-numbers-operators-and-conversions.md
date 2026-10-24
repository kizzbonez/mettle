---
title: Numbers, Operators and Conversions
summary: Choose between Go's integer and floating-point types, predict integer division, remainders, overflow and float rounding, use the math package and Go's operators, convert between number types explicitly, and turn numbers into text and back with strconv.
minutes: 35
objectives:
  - Choose an integer or floating-point type and predict overflow, integer division and remainders
  - Use the arithmetic, comparison and logical operators, ++ and compound assignment, and the math package
  - Convert between int and float64 explicitly and explain the mismatched types error
  - Convert numbers to and from strings with strconv.Itoa, Atoi, ParseFloat and FormatFloat
---

## Outline

1. Integer types and overflow
2. Integer division and remainders
3. Floating-point numbers and the math package
4. Operators, precedence and compound assignment
5. Comparisons and logical operators
6. Explicit conversions
7. Numbers and text with strconv
8. Bits and untyped constants

## Integer types and overflow

An integer type stores whole numbers in a fixed number of bits. `int8` uses 8 bits and holds -128
to 127; `int16`, `int32` and `int64` hold more. The **unsigned** types `uint8` to `uint64` hold no
negative numbers, so `uint8` reaches 255. `int` and `uint` are 64 bits on a 64-bit computer, which
is nearly every computer today. Use `int` unless a file format or a huge amount of data asks for
something else. The `math` package names the limits:

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	fmt.Println(math.MinInt8, math.MaxInt8, math.MaxUint8)
	fmt.Println(math.MaxInt64)

	var level int8 = 127
	level++
	fmt.Println(level)

	var count uint8 = 0
	count--
	fmt.Println(count)
}
```

```text
-128 127 255
9223372036854775807
-128
255
```

Going past the limit **overflows**: the value wraps around to the other end, with no error while
the program runs. The compiler does catch it for constants: `var big int8 = 200` gives
`cannot use 200 (untyped int constant) as int8 value in variable declaration (overflows)`.

## Integer division and remainders

```go
package main

import "fmt"

func main() {
	fmt.Println(7/2, 7%2, -7/2, -7%2)
	minutes := 135
	fmt.Println(minutes/60, "h", minutes%60, "min")
	fmt.Println(7.0/2, 7/2.0)
}
```

```text
3 1 -3 -1
2 h 15 min
3.5 3.5
```

Dividing two integers gives an integer: the fraction is dropped, **truncating** towards zero, so
`-7/2` is -3. The **remainder** operator `%` gives what is left over and takes the sign of the
left operand. Together they split quantities, as with the 135 minutes. With a floating-point
number on either side, `/` keeps the fraction.

Dividing an integer by zero stops the program: `12 / boxes` with `boxes` at 0 gives
`panic: runtime error: integer divide by zero`. If the zero is a constant, the compiler refuses:
`invalid operation: division by zero`.

## Floating-point numbers and the math package

`float64` holds numbers with a fraction in 64 bits. It stores them in binary, so most decimal
fractions are only approximated:

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	a, b := 0.1, 0.2
	fmt.Println(a + b)
	fmt.Println(a+b == 0.3)
	fmt.Println(math.Sqrt(2), math.Pow(2, 10))
	fmt.Println(math.Floor(2.7), math.Ceil(2.1), math.Round(2.5), math.Round(-2.5))
	zero := 0.0
	fmt.Println(1/zero, -1/zero, math.Inf(1))
}
```

```text
0.30000000000000004
false
1.4142135623730951 1024
2 3 3 -3
+Inf -Inf +Inf
```

Never compare computed floats with `==`, and keep money in whole cents as an `int`. `math.Floor`
rounds down, `math.Ceil` rounds up and `math.Round` goes to the nearest whole number, with halves
away from zero. Dividing a float by zero gives **infinity** (`+Inf`), not a panic.

## Operators, precedence and compound assignment

`*`, `/` and `%` bind tighter than `+` and `-`; operators of the same level work from left to
right, and parentheses override both. `x += 5` is short for `x = x + 5`, and there are `-=`,
`*=`, `/=` and `%=` too. `x++` and `x--` add or subtract 1.

```go
package main

import "fmt"

func main() {
	stock := 10
	stock += 5
	stock -= 3
	stock *= 2
	stock /= 4
	stock %= 4
	stock++
	fmt.Println(stock)
	fmt.Println(2+3*4, (2+3)*4, 10-4-3, 1+8/2%3)
}
```

```text
3
14 20 3 2
```

`1+8/2%3` is `1 + ((8/2) % 3)`. In Go, `++` and `--` are **statements**, not expressions: they
stand on a line of their own, and there is no `++x`. `next := seats++` gives
`syntax error: unexpected ++ at end of statement`.

## Comparisons and logical operators

`==`, `!=`, `<`, `<=`, `>` and `>=` compare two values of the same type and give a `bool`. `&&`
(and), `||` (or) and `!` (not) combine booleans:

```go
package main

import "fmt"

func main() {
	tickets, groups := 9, 0
	fmt.Println(tickets > 5, tickets == 9, tickets != 9)
	fmt.Println(tickets >= 10 || tickets%3 == 0)
	fmt.Println(!(tickets < 5) && groups == 0)
	fmt.Println(groups != 0 && tickets/groups > 2)
}
```

```text
true true false
true
true
false
```

`&&` and `||` **short-circuit**: they skip the right side when the left side already decides the
result. The last line is false without ever dividing by zero.

## Explicit conversions

Go never converts between number types on its own. `litres / bottles`, with a `float64` and an
`int`, gives `invalid operation: litres / bottles (mismatched types float64 and int)`. A
**conversion** `T(x)` turns a value into type `T`:

```go
package main

import "fmt"

func main() {
	litres := 7.5
	bottles := 3
	fmt.Println(litres / float64(bottles))
	fmt.Println(int(litres))

	debt := -2.7
	fmt.Println(int(debt))

	big := 300
	fmt.Println(int8(big))
}
```

```text
2.5
7
-2
44
```

Converting a float to an integer drops the fraction, towards zero; it does not round. Converting
to a smaller integer type keeps only the low bits, so 300 becomes 44. Go makes you write these
conversions so that every possible loss of information is visible in the code.

## Numbers and text with strconv

`"Seats: " + seats`, with an `int`, gives `mismatched types untyped string and int`. The
`strconv` package converts in both directions:

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	seats := 40
	label := "Seats: " + strconv.Itoa(seats)
	fmt.Println(label)

	n, err := strconv.Atoi("42")
	fmt.Println(n+1, err)

	n, err = strconv.Atoi("4 2")
	fmt.Println(n, err)

	price, err := strconv.ParseFloat("7.25", 64)
	fmt.Println(price*2, err)
	fmt.Println(strconv.FormatFloat(price, 'f', 2, 64), strconv.FormatFloat(1.0/3, 'f', -1, 64))
}
```

```text
Seats: 40
43 <nil>
0 strconv.Atoi: parsing "4 2": invalid syntax
14.5 <nil>
7.25 0.3333333333333333
```

`Itoa` turns an `int` into text. `Atoi` reads text as an `int` and returns two values: the number
and an **error**, which is `nil` (no error) when the text was a number. For text that is not a
number you get 0 and an error that says why; lesson 14 shows how to handle it. `ParseFloat(s, 64)`
reads a `float64`, and `FormatFloat(f, 'f', 2, 64)` writes one with two decimals (`-1` means
"as few digits as needed").

## Bits and untyped constants

`&` (and), `|` (or), `^` (exclusive or), `&^` (and not), `<<` and `>>` (shift) work on the bits of
integers: `0b0101&0b0100` is 4 and `1<<10` is 1024. Untyped constants are exact, far beyond 64
bits: with `const huge = 1 << 100`, `huge >> 98` is 4, and `1.0 / 3 * 3` is exactly 1. Only when a
constant becomes a variable must it fit its type.

## Common mistakes

- **Integer division by accident.** `float64(7 / 2)` is 3, because `7 / 2` is worked out first, as
  integers. Convert before dividing: `float64(7) / 2` is 3.5.
- **`string(n)` for a number.** It makes the character with that code, not digits, and `go vet`
  reports `conversion from int to string yields a string of one rune, not a string of digits`.
  Use `strconv.Itoa(n)`.
- **Converting a constant with a fraction.** `int(2.999)` gives `cannot convert 2.999 (untyped
  float constant) to type int`. Only variables are truncated; write the whole number you mean.
- **Comparing floats with `==`.** `0.1+0.2 == 0.3` is `false`. Use integers for exact amounts.

## Practice

1. What are `17 / 5`, `17 % 5`, `-17 / 5` and `17.0 / 5`?
2. A `uint8` holds 250. What does it hold after `+= 10`?
3. Turn `"12"` into an `int` with `strconv`, add 30, and turn the result back into a string.

### Answers

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	fmt.Println(17/5, 17%5, -17/5, 17.0/5)

	var crates uint8 = 250
	crates += 10
	fmt.Println(crates)

	n, err := strconv.Atoi("12")
	fmt.Println(strconv.Itoa(n+30), err)
}
```

```text
3 2 -3 3.4
4
42 <nil>
```

260 does not fit in 8 bits, so it wraps to 260 - 256 = 4.

## Key takeaways

- Use `int` for whole numbers and `float64` for fractions; integers overflow by wrapping around.
- Integer `/` truncates towards zero and `%` gives the remainder; integer division by zero panics.
- Floats are approximate: never compare them with `==`; `math` rounds, roots and powers.
- `++` and `--` are statements; `&&` and `||` short-circuit.
- Conversions are always explicit, `float64(n)` or `int(f)`, and `int(f)` truncates.
- `strconv.Itoa` and `Atoi` convert between `int` and text; `Atoi` also returns an error.

## Further reading

- [The Go Programming Language Specification: Arithmetic operators](https://go.dev/ref/spec#Arithmetic_operators)
- [Package strconv](https://pkg.go.dev/strconv)
- [Package math](https://pkg.go.dev/math)
- [Go blog: Constants](https://go.dev/blog/constants)
