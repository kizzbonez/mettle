---
title: Loops
summary: Repeat code with while and for, generate number sequences with range, leave or skip with break and continue, use the else clause of a loop, nest loops, apply the counting, accumulating and searching patterns, and avoid infinite loops.
minutes: 35
objectives:
  - Write while loops that end, and for loops over strings and ranges
  - Generate sequences with range(start, stop, step), including counting down
  - Control a loop with break and continue, and explain when a loop's else clause runs
  - Apply the count, accumulate and search patterns, and nest one loop inside another
  - Recognise and stop an infinite loop
---

## Outline

1. Why loops
2. The `while` loop
3. The `for` loop
4. `range`
5. Count, accumulate, search
6. `break` and `continue`
7. The `else` clause on loops
8. Nested loops
9. Infinite loops

## Why loops

Programs often need to do the same thing many times: add up 100 numbers, check each letter of a
word, ask again until the answer is valid. A **loop** repeats a block of code. Each pass through
the block is an **iteration**. Python has two loops: `while` repeats *as long as* a condition is
true, and `for` repeats *once for each item* of a sequence.

## The `while` loop

```python
balance = 100.0
years = 0
while balance < 200:
    balance = balance * 1.07
    years += 1
print(f"Doubled after {years} years: {balance:.2f}")
```

```text
Doubled after 11 years: 210.49
```

Python checks the condition `balance < 200`. If it is true, it runs the indented block, then goes
back and checks again. When the condition is false, it skips to the first line after the block.
If the condition is false at the start, the block never runs. Something inside the block must
eventually make the condition false; here `balance` grows each time.

Use `while` when you do not know in advance how many iterations you need.

## The `for` loop

Python's `for` is not the counting loop of C or Java. It walks through the items of any
**sequence**, such as a string, in order, binding a name to each item in turn:

```python
for letter in "Hey":
    print(letter)
```

```text
H
e
y
```

The name after `for` (here `letter`) is the **loop variable**. It is an ordinary variable: after
the loop it still holds the last item. `for` ends by itself when the items run out, so it cannot
loop forever over a string.

## `range`

To repeat something a number of times, or to work with numbers, loop over **`range`**:

- `range(stop)` gives 0, 1, ..., stop - 1.
- `range(start, stop)` gives start, ..., stop - 1.
- `range(start, stop, step)` counts in steps, and a negative step counts down.

The stop is **never included**, just as with slices.

```python
for n in range(4):
    print(n, end=" ")
print()
for n in range(2, 11, 2):
    print(n, end=" ")
print()
for n in range(10, 0, -3):
    print(n, end=" ")
print()
for n in range(5, 5):
    print("never")
print(len(range(10)), range(3))
```

```text
0 1 2 3
2 4 6 8 10
10 7 4 1
10 range(0, 3)
```

`range(4)` gives four numbers starting at 0, the indices of a four-item sequence. `range(5, 5)` is
empty, so the loop body never runs. A `range` does not store all its numbers; it produces each one
when the loop asks, so even `range(1_000_000)` takes almost no memory. Printing it shows only
`range(0, 3)`.

## Count, accumulate, search

Most loops follow one of a few patterns. Each needs a variable **initialised before the loop**.

```python
text = "mississippi"
count = 0
for letter in text:
    if letter == "s":
        count += 1
print(count)

total = 0
for n in range(1, 101):
    total += n
print(total)

largest = 0
for digit in "4917":
    if int(digit) > largest:
        largest = int(digit)
print(largest)
```

```text
4
5050
9
```

- **Count**: start at 0, add 1 when an item matches.
- **Accumulate**: start at 0 (or `""` for text) and add each item.
- **Best so far**: keep the largest (or smallest) seen; compare each item with it.

## `break` and `continue`

- **`break`** leaves the loop at once; the program continues after the loop. It is how you
  **search**: stop as soon as you find what you want.
- **`continue`** skips the rest of this iteration and goes on with the next one.

```python
for n in range(50, 70):
    if n % 7 == 0:
        print(f"First multiple of 7: {n}")
        break
for n in range(1, 11):
    if n % 3 == 0:
        continue
    print(n, end=" ")
print()
```

```text
First multiple of 7: 56
1 2 4 5 7 8 10
```

Both affect only the **innermost** loop they are in.

## The `else` clause on loops

A `for` or `while` loop may have an **`else`** block. It runs when the loop **finishes normally**,
and is skipped if the loop ended with `break`. It answers the question "did the search find
nothing?" without an extra variable:

```python
number = 91
for divisor in range(2, number):
    if number % divisor == 0:
        print(f"{number} = {divisor} * {number // divisor}")
        break
else:
    print(f"{number} is prime")
```

```text
91 = 7 * 13
```

With `number = 97` no divisor is found, the loop runs to the end, and the `else` prints
`97 is prime`. Look closely at the indentation: the `else` lines up with `for`, not with `if`. For
a `while` loop, `else` runs when the condition becomes false. Many languages have no such clause,
so some programmers find it surprising; use it where it makes the search clearer.

## Nested loops

A loop inside a loop is a **nested loop**: the inner loop runs completely for each iteration of
the outer one.

```python
for row in range(1, 4):
    for col in range(1, 5):
        print(f"{row * col:4}", end="")
    print()
```

```text
   1   2   3   4
   2   4   6   8
   3   6   9  12
```

The inner `print` stays on one line with `end=""`, and the outer `print()` ends each row. Three
rows of four make twelve inner iterations.

## Infinite loops

A `while` loop whose condition never becomes false runs forever. Sometimes that is a mistake:

```python
count = 3
while count > 0:
    print(count)
```

Nothing changes `count`, so this prints 3 without end. Press **Ctrl+C** to stop it; Python stops
with `KeyboardInterrupt`. The fix is to update the variable: `count -= 1`.

Sometimes `while True:` is deliberate, when the exit is decided in the middle of the block. This
loop reads amounts until the user types `done`:

```python
total = 0
while True:
    entry = input("Amount (or 'done'): ")
    if entry == "done":
        break
    total += float(entry)
print(f"Total: {total:.2f}")
```

```text
Amount (or 'done'): 12.50
Amount (or 'done'): 3
Amount (or 'done'): 4.25
Amount (or 'done'): done
Total: 19.75
```

A special value that marks the end of the input, here `done`, is called a **sentinel**.

## Common mistakes

- **Off by one with `range`.** `range(1, 10)` stops at 9. To include 10, write `range(1, 11)`.
- **Initialising inside the loop.** `total = 0` placed inside the loop resets the total on every
  iteration. Put it before.
- **Forgetting to update the `while` variable**: an infinite loop.
- **Indenting `else` under `if`** when you meant the loop's `else`, or the reverse. Line it up with
  the statement it belongs to.
- **Changing the loop variable to skip items.** Assigning to `n` inside `for n in range(10)`
  does not change the next item; the loop rebinds `n` each time. Use `continue` or `while`.

## Practice

1. Print the countdown `5 4 3 2 1 Go!` on one line, using `range`.
2. Read a word and print how many vowels it has (`a`, `e`, `i`, `o`, `u`, in either case).
3. Print the first number from 100 upwards that is divisible by both 6 and 14.

### Answers

1. ```python
   for n in range(5, 0, -1):
       print(n, end=" ")
   print("Go!")
   ```

   The stop, 0, is excluded, so the loop ends at 1.
2. ```python
   word = input()
   vowels = 0
   for letter in word.lower():
       if letter in "aeiou":
           vowels += 1
   print(vowels)
   ```

   For `Banana` it prints `3`. Lowering the word first means one test covers both cases.
3. ```python
   n = 100
   while n % 6 != 0 or n % 14 != 0:
       n += 1
   print(n)
   ```

   It prints `126`. A `while` suits this search because we do not know where it ends.

## Key takeaways

- `while` repeats while a condition is true; `for` takes each item of a sequence in turn.
- `range(start, stop, step)` produces numbers up to, but not including, `stop`.
- Initialise counters and totals before the loop.
- `break` leaves the innermost loop, `continue` skips to its next iteration, and a loop's `else`
  runs only if no `break` happened.
- Every `while` loop needs a way to end; Ctrl+C stops one that does not.

## Further reading

- [Tutorial: More control flow tools](https://docs.python.org/3.15/tutorial/controlflow.html)
- [Language reference: The while and for statements](https://docs.python.org/3.15/reference/compound_stmts.html#the-while-statement)
- [Built-in types: Ranges](https://docs.python.org/3.15/library/stdtypes.html#ranges)
