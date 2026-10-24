---
title: Interfaces
summary: Describe behaviour as a set of methods, let types satisfy it without declaring anything, write functions that accept any value with the right methods, get the concrete value back with type assertions and type switches, and avoid the nil-pointer-in-an-interface trap.
minutes: 40
objectives:
  - Declare an interface and make several types satisfy it, reading the compiler's reason when one does not
  - Write functions that accept small interfaces such as io.Writer and fmt.Stringer
  - Use any, comma-ok type assertions and type switches to recover concrete types
  - Explain why an interface holding a nil pointer is not nil, and return a real nil error
---

## Outline

1. An interface is a set of methods
2. Satisfied without a word
3. Small interfaces from the standard library
4. any, type assertions and type switches
5. An interface value holds a type and a value
6. Comparing interface values
7. Compile-time checks, and where interfaces belong

## An interface is a set of methods

So far every function has taken one concrete type, so a till that takes cash and cards would need
`totalCash` and `totalCards`. An **interface** type names the behaviour such types share, as a
list of method signatures. A variable of the interface type can hold any value that has them:

```go
type Payment interface {
	Pence() int
}

type Cash int

func (c Cash) Pence() int {
	return int(c)
}

type Card struct {
	Last4  string
	Amount int
}

func (c *Card) Pence() int {
	return c.Amount
}

func total(payments []Payment) int {
	sum := 0
	for _, p := range payments {
		sum += p.Pence()
	}
	return sum
}

func main() {
	payments := []Payment{Cash(500), &Card{Last4: "4242", Amount: 1250}, Cash(80)}
	fmt.Println(total(payments))
}
```

```text
1830
```

`total` knows nothing about cash or cards, only that each value has `Pence() int`. A gift voucher
added next year will work with it unchanged. Calling `p.Pence()` runs the method of whatever
concrete type `p` holds at that moment.

## Satisfied without a word

Neither `Cash` nor `Card` mentions `Payment`. A type **satisfies** (or implements) an interface
when its method set contains every method of the interface, with the same names and signatures;
there is no `implements` keyword. So a new interface is satisfied at once by the types that
already have its methods, even in other packages.

The method set from the last lesson decides. `Card`'s method has a pointer receiver, so `*Card`
is a `Payment` and a `Card` value is not. A `Card{...}` and a `Voucher{...}`, whose type has no
`Pence` method, in the slice literal give:

```text
./main.go:25:24: cannot use Card{…} (value of struct type Card) as Payment value in array or slice literal: Card does not implement Payment (method Pence has pointer receiver)
./main.go:25:59: cannot use Voucher{…} (value of struct type Voucher) as Payment value in array or slice literal: Voucher does not implement Payment (missing method Pence)
```

## Small interfaces from the standard library

The most useful interfaces have one or two methods, and a one-method interface is usually named
after its method plus -er:

- `fmt.Stringer` is `String() string`, which `fmt` uses for printing.
- `error` is `Error() string`: every error value you have returned satisfies it.
- `io.Writer` is `Write(p []byte) (n int, err error)`: anything that accepts bytes, such as
  `os.Stdout`, a file, a network connection or a `*strings.Builder`.
- `io.Reader` is `Read(p []byte) (n int, err error)`: anything that produces bytes. Medium 11
  builds on both. (`sort.Interface`, with three methods, is older; Medium 08 explains.)

A function that takes an `io.Writer` can print to the terminal, build a string or write a file
with the same code:

```go
func printReceipt(w io.Writer, payments []Payment) {
	sum := 0
	for _, p := range payments {
		fmt.Fprintf(w, "%6d\n", p.Pence())
		sum += p.Pence()
	}
	fmt.Fprintf(w, "%6d total\n", sum)
}

func main() {
	payments := []Payment{Cash(500), Cash(80)}
	printReceipt(os.Stdout, payments)

	var sb strings.Builder
	printReceipt(&sb, payments[:1])
	fmt.Printf("%q\n", sb.String())
}
```

```text
   500
    80
   580 total
"   500\n   500 total\n"
```

The smaller the interface a function asks for, the more types can use it, and the easier it is to
test: a test passes a `strings.Builder` and checks what was written.

## any, type assertions and type switches

`interface{}`, with no methods, is satisfied by every type. Its built-in alias is **`any`**:
`fmt.Println` takes `...any`. Holding a value as an interface hides its concrete type, and a
**type assertion** `p.(T)` gets it back. The comma-ok form reports whether it worked; the plain
form panics when it does not. A **type switch** tests several types in one statement:

```go
func describe(p Payment) string {
	switch p := p.(type) {
	case Cash:
		return fmt.Sprintf("%d in cash", p)
	case *Card:
		return "card ending " + p.Last4
	default:
		return fmt.Sprintf("a %T", p)
	}
}

func main() {
	payments := []Payment{Cash(500), &Card{Last4: "4242", Amount: 1250}}
	for _, p := range payments {
		fmt.Println(describe(p))
	}
	card, ok := payments[1].(*Card)
	fmt.Println(card.Last4, ok)
	cash, ok := payments[1].(Cash)
	fmt.Println(cash, ok)
	fmt.Println(payments[1].(Cash))
}
```

```text
500 in cash
card ending 4242
4242 true
0 false
panic: interface conversion: main.Payment is *main.Card, not main.Cash
```

Inside each `case`, `p` has that case's type, so `p.Last4` works. A case may also name an
interface (`case fmt.Stringer:`) or `nil`. Use assertions sparingly: when you switch on types to
decide what to do, a method on the interface is usually the better design.

## An interface value holds a type and a value

An interface value is a pair: a **dynamic type** and a **dynamic value**. It is `nil` only when
both are unset. Storing a nil `*LimitError` in an `error` gives the pair (`*LimitError`, nil),
which is not nil. Error types like this one are the subject of Medium 05:

```go
type LimitError struct {
	Limit int
}

func (e *LimitError) Error() string {
	return fmt.Sprintf("over the limit of %d", e.Limit)
}

func authorise(pence int) error {
	var err *LimitError
	if pence > 10000 {
		err = &LimitError{Limit: 10000}
	}
	return err
}

func main() {
	err := authorise(500)
	if err != nil {
		fmt.Println("declined:", err)
	}
	fmt.Printf("%v %T\n", err == nil, err)
}
```

```text
declined: <nil>
false *main.LimitError
```

A payment of 500 is declined. Return the interface type's nil directly: `return nil` in the good
case, `return &LimitError{...}` in the bad one, and never a typed pointer variable that may be
nil.

## Comparing interface values

Two interface values are equal when their dynamic types are identical and their dynamic values
are equal, or when both are nil. If the dynamic type cannot be compared, such as a slice, `==`
compiles but panics:

```go
var a, b any = Cash(5), Cash(5)
fmt.Println(a == b, a == Cash(5), a == any(5))
var x, y any = []int{1}, []int{1}
fmt.Println(x == y)
```

```text
true true false
panic: runtime error: comparing uncomparable type []int
```

`a == any(5)` is false: an `int` 5 is not a `Cash` 5.

## Compile-time checks, and where interfaces belong

A package-level declaration makes the compiler confirm that a type satisfies an interface, so a
renamed method breaks the build next to the type rather than far away:

```go
var _ Payment = (*Card)(nil)
```

`(*Card)(nil)` is a nil `*Card`, which costs nothing. Writing `Card{}` there instead fails with
`Card does not implement Payment (method Pence has pointer receiver)`.

Two habits keep interfaces useful. Define an interface in the package that uses it, with only the
methods that code calls. And **accept interfaces, return structs**: functions take the smallest
interface they need and return concrete types, which callers can use fully. Advanced 10
develops both.

## Common mistakes

- **A pointer receiver, then a value where the interface is wanted.** `Card does not implement
  Payment (method Pence has pointer receiver)`. Pass `&Card{...}`.
- **Returning a nil pointer as an error.** `err != nil` is true and the message is `<nil>`.
  Return a literal `nil`.
- **An assertion without comma-ok.** A wrong guess panics with `interface conversion: ...`. Use
  `v, ok := x.(T)` unless a wrong type is truly impossible.
- **Big interfaces.** An interface with ten methods has few implementations and is hard to fake
  in tests. Split it into small ones.

## Practice

1. Add a type `Voucher` with fields `Code string` and `Amount int` that is a `Payment` as a value.
2. Write `cardTotal(payments []Payment) int`, which adds up only the card payments, with a
   comma-ok assertion.
3. Write `kind(v any) string` with a type switch that handles `nil`, `int`, `fmt.Stringer`
   and everything else (`%T`).

### Answers

```go
type Voucher struct {
	Code   string
	Amount int
}

func (v Voucher) Pence() int {
	return v.Amount
}

func cardTotal(payments []Payment) int {
	sum := 0
	for _, p := range payments {
		if card, ok := p.(*Card); ok {
			sum += card.Amount
		}
	}
	return sum
}

func kind(v any) string {
	switch v := v.(type) {
	case nil:
		return "nothing"
	case int:
		return fmt.Sprintf("int %d", v)
	case fmt.Stringer:
		return "a Stringer: " + v.String()
	default:
		return fmt.Sprintf("%T", v)
	}
}
```

For cash 500, cards of 1250 and 99 and a voucher of 300, `cardTotal` gives 1349. `kind` of
`nil`, `7`, a `*strings.Builder` holding `hi`, and `2.5` gives:

```text
nothing | int 7 | a Stringer: hi | float64
```

## Key takeaways

- An interface is a set of methods; every type whose method set has them satisfies it.
- Keep interfaces small, like `io.Writer`, `io.Reader`, `fmt.Stringer` and `error`.
- `any` holds anything; `v, ok := x.(T)` and type switches get the concrete type back.
- An interface is nil only if its type and value are both unset; return `nil`, not a nil pointer.
- `==` on interfaces compares type and value, and panics on uncomparable types.
- `var _ I = (*T)(nil)` checks satisfaction at compile time. Accept interfaces, return structs.

## Further reading

- [The Go Programming Language Specification: Interface types](https://go.dev/ref/spec#Interface_types)
- [Effective Go: Interfaces and other types](https://go.dev/doc/effective_go#interfaces_and_types)
- [Go FAQ: Why is my nil error value not equal to nil?](https://go.dev/doc/faq#nil_error)
- [Go by Example: Interfaces](https://gobyexample.com/interfaces)
