---
title: Numbers and Arithmetic
summary: Python's two everyday number types, int and float, the arithmetic operators including floor division and remainder with negative numbers, precedence and associativity, augmented assignment, binary, octal and hexadecimal numbers, bitwise operators, and a first import of the math module.
minutes: 35
objectives:
  - Predict the type and value of expressions using + - * / // % and **, including with negative numbers
  - Explain why 0.1 + 0.2 is not exactly 0.3 and compare floats safely
  - Apply precedence and associativity rules, and use augmented assignment
  - Write and convert numbers in binary, octal and hexadecimal, and read simple bitwise expressions
  - Import the math module and use its functions
---

## Outline

1. Integers and floats
2. The arithmetic operators
3. Floor division and remainder
4. How floats work, and why 0.1 + 0.2 is not 0.3
5. Precedence and associativity
6. Augmented assignment
7. Other numeral systems and bitwise operators
8. A first import: `math`

In this lesson each line's output is shown as a comment after it, like `# 9`.

## Integers and floats

An **integer** (`int`) is a whole number: `7`, `-3`, `0`. A **floating-point number** (`float`)
has a fractional part: `3.5`, `2.0`. A number written in your code is a **literal**, and
underscores may group its digits: `1_000_000`. Python integers have **unlimited precision**: they
grow as large as memory allows, where many languages stop at 64 bits.

```python
print(2 ** 100)        # 1267650600228229401496703205376
print(1_000_000 * 3)   # 3000000
```

Floats can be written in **scientific notation**: `1.5e3` means 1.5 × 10³, and `2.5e-4` means
2.5 × 10⁻⁴. Python itself prints very large or very small floats that way:

```python
print(1.5e3, 2.5e-4, 6.02e23)   # 1500.0 0.00025 6.02e+23
```

## The arithmetic operators

| Operator | Meaning | Example | Result |
| --- | --- | --- | --- |
| `+` `-` `*` | add, subtract, multiply | `7 * 2` | `14` |
| `/` | true division, always a float | `8 / 2` | `4.0` |
| `//` | floor division | `17 // 5` | `3` |
| `%` | remainder (modulo) | `17 % 5` | `2` |
| `**` | power | `2 ** 10` | `1024` |

These are **binary operators**: they take two operands. `-` and `+` can also be **unary
operators**, taking one operand, as in `-x`.

If either operand is a float, the result is a float. And `/` *always* gives a float, even when the
division is exact; in C and Java, `7 / 2` between integers is 3.

```python
print(7 / 2, 8 / 2)    # 3.5 4.0
print(7 + 2.0)         # 9.0
print(10 ** -2)        # 0.01
```

A negative power of an integer gives a float. Dividing by zero, with `/`, `//` or `%`, raises
`ZeroDivisionError: division by zero`.

## Floor division and remainder

`a // b` divides and rounds **down**, towards minus infinity, and `a % b` is what remains. They
always fit together: `a == (a // b) * b + a % b`. With positive numbers this is ordinary school
division. With negatives, "down" matters:

```python
print(17 // 5, 17 % 5)     # 3 2
print(-17 // 5, -17 % 5)   # -4 3
print(17 // -5, 17 % -5)   # -4 -3
print(7.5 // 2, 7.5 % 2)   # 3.0 1.5
```

`-17 / 5` is -3.4, and rounding down gives -4, not -3. Then -4 × 5 = -20, and -17 is 3 more than
that. The result of `%` always has the sign of the right operand. C and Java truncate towards
zero instead and give -3 and -2 here.

`//` and `%` split a quantity into units: 135 minutes is `135 // 60` hours and `135 % 60` minutes,
2 and 15. And `n % 2 == 0` tests whether `n` is even.

## How floats work, and why 0.1 + 0.2 is not 0.3

Floats are stored in binary, in the IEEE 754 double format, with about 16 significant decimal
digits. Most decimal fractions have no exact binary form, just as 1/3 has no exact decimal form:
1/10 in binary is 0.000110011001100... forever, so Python stores the nearest value it can.

```python
print(0.1 + 0.2)                    # 0.30000000000000004
print(0.1 + 0.2 == 0.3)             # False
print(round(0.1 + 0.2, 2) == 0.3)   # True
```

The tutorial says this "is not a bug in Python, and it is not a bug in your code either"; every
language using your processor's floats behaves the same. So never compare floats with `==` after
arithmetic (round them, or use `math.isclose` below), and do not keep money in floats.

Two built-in functions help. `abs(x)` gives the absolute value: `abs(-2.5)` is `2.5`.
`round(x, n)` rounds to `n` decimal places, and `round(x)` to the nearest integer, rounding exact
halves **to the even neighbour**:

```python
print(round(3.14159, 2), round(-2.7))   # 3.14 -3
print(round(2.5), round(3.5))           # 2 4
```

## Precedence and associativity

When an expression has several operators, **precedence** decides which binds first, and
**associativity** decides the order among operators of equal precedence. From highest to lowest:

1. `**` (power)
2. unary `+x`, `-x`, `~x`
3. `*`, `/`, `//`, `%`
4. `+`, `-`
5. shifts `<<`, `>>`, then `&`, then `^`, then `|`
6. comparisons, then `not`, `and`, `or` (lesson 7)

Operators of the same level group **left to right**, except `**`, which groups **right to
left**. `**` also binds tighter than a minus on its left, but looser than one on its right.

```python
print(2 + 3 * 4, (2 + 3) * 4)   # 14 20
print(20 - 5 - 3, 20 / 5 / 2)   # 12 2.0
print(2 ** 3 ** 2)              # 512, that is 2 ** 9
print(-2 ** 2, (-2) ** 2)       # -4 4
print(2 ** -1)                  # 0.5
```

`-2 ** 2` is `-(2 ** 2)`. When in doubt, add parentheses; they cost nothing and help the reader.

## Augmented assignment

Updating a name from its own value is so common that every operator has a shortcut:
`total += 5` means `total = total + 5`. Here the comments show the value after each line:

```python
total = 10
total += 5     # 15
total -= 3     # 12
total *= 2     # 24
total /= 4     # 6.0
count = 17
count //= 5    # 3
count **= 3    # 27
```

`total /= 4` made `total` a float. Python has no `++`: `count++` is a `SyntaxError`, and `++count`
means `+(+count)` and changes nothing. Write `count += 1`.

## Other numeral systems and bitwise operators

Integers can also be written in **binary** (base 2, prefix `0b`), **octal** (base 8, `0o`) and
**hexadecimal** (base 16, `0x`, digits 0 to 9 then A to F). They are only other spellings of the
same `int`. `bin`, `oct` and `hex` go the other way, producing text, and `int(text, base)` reads
text in any base from 2 to 36:

```python
print(0b1010, 0o17, 0xFF)                   # 10 15 255
print(bin(10), oct(15), hex(255))           # 0b1010 0o17 0xff
print(int("1010", 2), int("ff", 16))        # 10 255
```

**Bitwise operators** work on the binary digits (bits) of integers: `&` (and: 1 where both are
1), `|` (or: 1 where either is 1), `^` (exclusive or: 1 where they differ), `~` (invert, which
gives `-x - 1`), and the shifts `<<` and `>>`, which multiply or floor-divide by powers of 2.

```python
print(6 & 3, 6 | 3, 6 ^ 3, ~6)   # 2 7 5 -7
print(1 << 4, 40 >> 2)           # 16 10
```

With 6 = `0b110` and 3 = `0b011`, only the middle bit is 1 in both, so `6 & 3` is `0b010`, 2.

## A first import: `math`

Python's **standard library** is a set of ready-made **modules** that come with it. `import math`
loads the `math` module, and you use its contents with a dot:

```python
import math

print(math.sqrt(16), math.pi)            # 4.0 3.141592653589793
print(math.floor(-2.5), math.ceil(2.1))  # -3 3
print(math.isclose(0.1 + 0.2, 0.3))      # True
print(round(math.pi * 3 ** 2, 2))        # 28.27
```

Put imports at the top of the file. `math.floor` rounds down and `math.ceil` up, both to an `int`.

## Common mistakes

- **Expecting `/` to give an int.** `8 / 2` is `4.0`. Use `//` for whole-number division.
- **Assuming `//` truncates.** `-7 // 2` is `-4`, not `-3`.
- **Comparing floats with `==`.** `0.1 + 0.2 == 0.3` is `False`; use `math.isclose` or round.
- **Writing `^` for power.** `2 ^ 3` is exclusive or, which gives 1. Power is `2 ** 3`.

## Practice

1. What do `-9 // 4`, `-9 % 4` and `9 % -4` give?
2. A video is 4000 seconds long. Print it as hours, minutes and seconds using `//` and `%`.
3. What do `2 * 3 ** 2` and `-3 ** 2` give, and why? And what is `int("7f", 16)`?

### Answers

1. `-3`, `3` and `-3`. -9 / 4 is -2.25; rounding down gives -3, and -9 - (-12) = 3. In `9 % -4`
   the result takes the sign of -4.
2. ```python
   length = 4000
   hours = length // 3600
   minutes = length % 3600 // 60
   seconds = length % 60
   print(hours, minutes, seconds)   # 1 6 40
   ```

   `%` and `//` have the same precedence and group left to right, so `length % 3600 // 60` is
   `(length % 3600) // 60`.
3. `18` and `-9`, because `**` binds tightest: `2 * 9`, and `-(3 ** 2)`. `int("7f", 16)` is
   `127`: 7 × 16 + 15.

## Key takeaways

- `int` has unlimited precision; `float` is binary and approximate, so never compare floats with
  `==` after arithmetic.
- `/` always returns a float; `//` rounds down, and `%` takes the sign of the right operand.
- `**` binds tightest and groups right to left; other operators group left to right.
- `+=` and friends update a name; there is no `++`.
- `0b`, `0o` and `0x` write other bases; `bin`, `oct`, `hex` and `int(text, base)` convert.

## Further reading

- [Built-in types: Numeric types](https://docs.python.org/3.15/library/stdtypes.html#numeric-types-int-float-complex)
- [Tutorial: Floating-point arithmetic, issues and limitations](https://docs.python.org/3.15/tutorial/floatingpoint.html)
- [Language reference: Operator precedence](https://docs.python.org/3.15/reference/expressions.html#operator-precedence)
- [The math module](https://docs.python.org/3.15/library/math.html)
