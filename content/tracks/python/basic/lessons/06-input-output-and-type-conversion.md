---
title: Input, Output and Type Conversion
summary: Print several values with control over separators and line endings, read what the user types with input(), and convert between text and numbers with int(), float(), str() and bool(), including the ValueError a bad conversion raises, then put it together in a small interactive program.
minutes: 30
objectives:
  - Print several values in one call and control the output with sep and end
  - Read a line of input with input() and explain why it is always a string
  - Convert values with int(), float(), str() and bool(), and predict when a conversion raises ValueError
  - Write a small program that asks for numbers, calculates and prints a formatted result
---

## Outline

1. `print` with several values, `sep` and `end`
2. `input()` always returns a string
3. Converting types: `int`, `float`, `str`, `bool`
4. When a conversion fails
5. A small interactive program

## `print` with several values, `sep` and `end`

So far `print` has written one thing per line. It accepts any number of values, of any type,
separated by commas. It converts each one to text, writes them with a space between them, and
ends with a new line. Two **keyword arguments**, given by name after the values, change that:
`sep` is what goes between the values (default `" "`), and `end` is what goes after the last one
(default `"\n"`, a new line).

```python
print("Ada", 36, 1.5, True)
print("2026", "10", "15", sep="-")
print("Loading", end="")
print("...", end=" ")
print("done")
print("x", "y", "z", sep=", ", end=".\n")
print("no", "gaps", sep="")
```

```text
Ada 36 1.5 True
2026-10-15
Loading... done
x, y, z.
nogaps
```

`end=""` keeps the next `print` on the same line. Notice that `print("Ada", 36)` happily mixes a
string and a number, while `"Ada" + 36` is a `TypeError`: `print` converts each value itself, but
`+` does not.

## `input()` always returns a string

`input()` waits for the user to type a line and press Enter, and **returns** the text they typed,
without the Enter. "Returns" means the call is replaced by that value, so you can bind it to a
name. If you give it a string, the **prompt**, it prints that first, without a new line, so the
answer is typed right after it.

```python
name = input("What is your name? ")
age_text = input("How old are you? ")
print(type(age_text))
age = int(age_text)
print(f"Hello, {name}! Next year you will be {age + 1}.")
```

In a terminal it looks like this; what the user typed appears after each prompt:

```text
What is your name? Ada
How old are you? 36
<class 'str'>
Hello, Ada! Next year you will be 37.
```

The key fact: **`input()` always gives a `str`**, even when the user types digits. `"36"` is two
characters, not a number. Forgetting this is the most common beginner error:

```python
age = input("How old are you? ")
print(age + 1)
```

```text
How old are you? 36
Traceback (most recent call last):
  File "/tmp/c.py", line 2, in <module>
    print(age + 1)
          ~~~~^~~
TypeError: can only concatenate str (not "int") to str
```

Python does not guess that you meant a number. You must convert it. When there is no more input
at all (the user presses Ctrl+D, or Ctrl+Z then Enter on Windows), `input()` raises `EOFError`;
lesson 14 shows how to handle that.

## Converting types: `int`, `float`, `str`, `bool`

Changing a value from one type to another is called **type conversion** or **type casting**. In
Python you call the type's name like a function, and it returns a **new** object of that type;
the original is unchanged.

```python
print(int("42"), int(" -7 "), int(3.99), int(-3.99), int(True))
print(float("3.5"), float("1e3"), float(" 2 "), float(7))
print(str(42) + "!", str(3.0), str(True))
print(bool(0), bool(42), bool(0.0), bool(""), bool("False"), bool(" "))
print(int(float("3.5")))
```

```text
42 -7 3 -3 1
3.5 1000.0 2.0 7.0
42! 3.0 True
False True False False True True
3
```

- **`int(x)`** accepts a string of digits, with an optional sign and spaces around it. From a
  float it **truncates towards zero**: `int(3.99)` is 3 and `int(-3.99)` is -3. It does not round;
  use `round()` for that.
- **`float(x)`** accepts decimal text, including scientific notation like `"1e3"`.
- **`str(x)`** turns anything into its text form, so `str(42) + "!"` works.
- **`bool(x)`** is `False` for zero and for the empty string `""`, and `True` for everything else.
  So `bool("False")` is `True`: it is a non-empty string. Lesson 7 explains this "truthiness".
- To read a decimal and keep only the whole part, convert twice: `int(float("3.5"))`.

## When a conversion fails

A conversion that cannot make sense of its input raises a **`ValueError`**: the type is right
(a string), but the value is not one it can convert.

```python
print(int("3.5"))
```

```text
Traceback (most recent call last):
  File "/tmp/e.py", line 1, in <module>
    print(int("3.5"))
          ~~~^^^^^^^
ValueError: invalid literal for int() with base 10: '3.5'
```

`int()` wants a whole number, so `"3.5"`, `"twelve"` and the empty string `""` (the user just
pressed Enter) all fail, each with the offending text in quotes at the end of the message.
`float("twelve")` gives `ValueError: could not convert string to float: 'twelve'`. For now a bad
answer stops the program; lesson 14 teaches you to catch the error and ask again.

## A small interactive program

Three friends share the fuel for a trip. The program asks for four numbers, converts each answer
as it reads it, calculates, and prints a tidy result.

```python
distance = float(input("Distance (km): "))
usage = float(input("Fuel use (litres per 100 km): "))
price = float(input("Price per litre: "))
people = int(input("People sharing: "))

litres = distance * usage / 100
cost = litres * price
print(f"Fuel needed: {litres:.1f} litres")
print(f"Total cost:  {cost:.2f}")
print(f"Each pays:   {cost / people:.2f}")
```

```text
Distance (km): 420
Fuel use (litres per 100 km): 6.5
Price per litre: 1.79
People sharing: 3
Fuel needed: 27.3 litres
Total cost:  48.87
Each pays:   16.29
```

`float(input(...))` nests two calls: `input` runs first and returns the text, and `float`
converts it. People must be a whole number, so it uses `int`. The calculation uses the numbers,
and only the final f-strings round them for display.

## Common mistakes

- **Doing arithmetic on input.** `input() + 1` is a `TypeError`. Convert first.
- **Multiplying a string by accident.** If `count = input()` and the user types `7`, `count * 3`
  is `"777"`, not 21.
- **`int()` on decimal text.** `int("2.5")` is a `ValueError`. Use `float`, or
  `int(float(text))` if you really want to drop the fraction.
- **Expecting `int()` to round.** `int(2.99)` is 2. Use `round(2.99)` for 3.
- **Trusting `bool()` on text.** `bool("no")` and `bool("0")` are both `True`. Compare the text
  instead: `answer == "yes"`.

## Practice

1. Print the date parts `15`, `10`, `2026` as `15/10/2026` with one `print` call.
2. Write a program that reads a width and a height (whole numbers, one per line, no prompts) and
   prints the area.
3. What do `int(-7.9)`, `float("1e-2")`, `str(0.5) * 2` and `bool("0")` give?

### Answers

1. `print(15, 10, 2026, sep="/")`. `print` converts the numbers, and `sep` puts `/` between them.
2. ```python
   width = int(input())
   height = int(input())
   print(width * height)
   ```

   With the input `4` and `5` it prints `20`. Without `int`, `width * height` would be a
   `TypeError`, because two strings cannot be multiplied.
3. `-7` (truncated towards zero), `0.01`, `'0.50.5'` (a string repeated twice), and `True` (a
   non-empty string).

## Key takeaways

- `print` takes any number of values; `sep` goes between them and `end` after them.
- `input()` returns what the user typed as a `str`, always.
- `int()`, `float()`, `str()` and `bool()` return new values of their type.
- `int()` truncates floats towards zero and rejects text like `"3.5"` with a `ValueError`.
- Convert input as you read it: `float(input("Price: "))`.

## Further reading

- [Built-in functions: print()](https://docs.python.org/3.15/library/functions.html#print)
- [Built-in functions: input()](https://docs.python.org/3.15/library/functions.html#input)
- [Built-in functions: int()](https://docs.python.org/3.15/library/functions.html#int)
- [Tutorial: Input and output](https://docs.python.org/3.15/tutorial/inputoutput.html)
