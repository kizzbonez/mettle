---
title: Loops
summary: Repeat work with for, while, do and foreach, leave or skip ahead with break and continue, and avoid the off-by-one and endless-loop mistakes.
minutes: 25
objectives:
  - Write `for`, `while`, `do` and `foreach` loops and choose the right one for a task
  - Trace a loop by hand and predict how many times its body runs
  - Use `break` and `continue` to leave a loop or skip to the next round
  - Recognize off-by-one errors and endless loops and fix them
---

## Outline

1. Why loops
2. The `for` loop
3. The `while` and `do` loops
4. The `foreach` loop
5. `break` and `continue`
6. Loops inside loops
7. Off by one, and loops that never end

## Why loops

Programs repeat work: process every line of a file, try again until the input is valid, add up
a list of numbers. A **loop** runs its body, the block in braces, again and again while a
condition holds. Each run of the body is an **iteration**.

## The `for` loop

`for` is the loop for counting. Its parentheses hold three parts separated by semicolons:

```csharp
for (int i = 1; i <= 5; i++)
{
    Console.Write($"{i} ");
}
Console.WriteLine();
for (int i = 10; i > 0; i -= 3)
{
    Console.Write($"{i} ");
}
Console.WriteLine();
```

```text
1 2 3 4 5 
10 7 4 1 
```

1. The **initializer** `int i = 1` runs once, before anything else.
2. The **condition** `i <= 5` is tested before every iteration. When it is `false`, the loop
   ends.
3. The **iterator** `i++` runs after every iteration.

So the second loop counts 10, 7, 4, 1, and stops when `i` becomes -2. The variable `i` belongs to
the loop and does not exist after it. The most common use is walking through positions 0 to
`Length - 1` of an *array*, a fixed-size list of values written in square brackets (lesson 9
covers arrays):

```csharp
int[] laps = [62, 58, 61, 57];
int total = 0;
for (int i = 0; i < laps.Length; i++)
{
    total += laps[i];
    Console.WriteLine($"Lap {i + 1}: {laps[i]} s, running total {total} s");
}
```

```text
Lap 1: 62 s, running total 62 s
Lap 2: 58 s, running total 120 s
Lap 3: 61 s, running total 181 s
Lap 4: 57 s, running total 238 s
```

`total` is declared *before* the loop. A variable declared inside the body would start again
at 0 on every iteration. This pattern, a variable that collects a result across iterations, is
called an **accumulator**.

## The `while` and `do` loops

`while` repeats as long as its condition is `true`, and checks the condition *before* each
iteration, so the body may run zero times. Use it when you do not know in advance how many
iterations are needed. `do` checks *after* the body, so the body always runs at least once:

```csharp
int distance = 0;
int day = 0;
while (distance < 42)
{
    day++;
    distance += 9;
}
Console.WriteLine($"Day {day}: {distance} km");
int tries = 0;
do
{
    tries++;
    Console.WriteLine($"Attempt {tries}");
} while (tries < 0);
```

```text
Day 5: 45 km
Attempt 1
```

The condition of the `do` loop is false from the start, yet the body ran once. That makes `do`
right for "ask, then check the answer" input loops. Note the semicolon after `while (...)` in a
`do` loop.

## The `foreach` loop

`foreach` visits every element of a collection in order, without any position to manage:

```csharp
string[] runners = ["Ama", "Bo", "Cy"];
foreach (string runner in runners)
{
    Console.WriteLine($"Good luck, {runner}!");
}
```

```text
Good luck, Ama!
Good luck, Bo!
Good luck, Cy!
```

It works on arrays, on the lists and dictionaries of lessons 9 and 10, and on strings, one
`char` at a time: `foreach (char c in "abc")`. The loop variable is read-only. Assigning to it is
an error, because it would not change the collection anyway:

```csharp
string[] runners = ["Ama", "Bo"];
foreach (string runner in runners)
{
    runner = runner.ToUpper();
}
```

```text
Program.cs(4,5): error CS1656: Cannot assign to 'runner' because it is a 'foreach iteration variable'
```

Use `foreach` when you need every element and not its position. Use `for` when you need the
position, or want to visit only some positions.

## `break` and `continue`

`break` leaves the loop at once. `continue` skips the rest of the body and starts the next
iteration. Here, invalid times of 0 or less are skipped, and 999 marks the end of the data:

```csharp
int[] times = [250, 0, 241, -5, 262, 999, 230];
int best = int.MaxValue;
foreach (int t in times)
{
    if (t <= 0)
    {
        continue;
    }
    if (t == 999)
    {
        break;
    }
    if (t < best)
    {
        best = t;
    }
}
Console.WriteLine($"Best time before the end marker: {best}");
```

```text
Best time before the end marker: 241
```

Starting `best` at `int.MaxValue` guarantees that the first real time is smaller. The 230 after
the marker is never looked at.

## Loops inside loops

The body of a loop can contain another loop. The inner loop runs completely for every
iteration of the outer one:

```csharp
for (int row = 1; row <= 3; row++)
{
    for (int col = 1; col <= 4; col++)
    {
        Console.Write($"{row * col,4}");
    }
    Console.WriteLine();
}
```

```text
   1   2   3   4
   2   4   6   8
   3   6   9  12
```

The inner body runs 3 × 4 = 12 times. `,4` pads each number to four characters, as in lesson 5.
A `break` inside the inner loop leaves only the inner loop.

## Off by one, and loops that never end

The commonest loop bug is going one step too far, or stopping one step short. With `<=`, the
loop below reads position 3 of a three-element array, whose positions are 0, 1 and 2:

```csharp
int[] laps = [62, 58, 61];
for (int i = 0; i <= laps.Length; i++)
{
    Console.WriteLine(laps[i]);
}
```

```text
62
58
61
Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.
   at Program.<Main>$(String[] args) in /home/ada/laps/Program.cs:line 4
```

Counting from 0, the condition is `i < laps.Length`. The other classic bug is a `while` loop
whose body never changes what the condition tests, such as `while (i < 3)` with no `i++`. It
runs forever. Press Ctrl+C in the terminal to stop it.

## Common mistakes

- **`<=` with a zero-based index.** Loop with `i < array.Length`.
- **Forgetting to update the loop variable** in a `while` loop: the loop never ends.
- **Declaring the accumulator inside the loop.** It restarts on every iteration.
- **A semicolon after the parentheses.** `for (int i = 0; i < 3; i++);` has an empty body, and
  the block after it runs once. The compiler warns: CS0642, "Possible mistaken empty statement".
- **Assigning to the `foreach` variable.** Error CS1656. Use `for` with an index to change
  elements.

## Practice

1. Add up all whole numbers from 1 to 100 that are divisible by 3 or by 5.
2. Starting from 1, double a number until it reaches at least 1000. How many doublings does it
   take, and what is the final number?
3. Print a triangle of stars four rows high, one star on the first row, four on the last.
   `new string('*', n)` makes a string of `n` stars.

### Answers

```csharp
int sum = 0;
for (int n = 1; n <= 100; n++)
{
    if (n % 3 == 0 || n % 5 == 0)
    {
        sum += n;
    }
}
Console.WriteLine(sum);

int number = 1;
int steps = 0;
while (number < 1000)
{
    number *= 2;
    steps++;
}
Console.WriteLine($"{steps} {number}");

for (int size = 1; size <= 4; size++)
{
    Console.WriteLine(new string('*', size));
}
```

```text
2418
10 1024
*
**
***
****
```

The first loop needs every number, so it counts with `for`. The second does not know in
advance how many steps it needs, so it uses `while`. The third uses the loop counter as the row
length.

## Key takeaways

- `for` counts, `while` repeats while a condition holds, `do` runs at least once, and `foreach`
  visits every element.
- `break` leaves the loop. `continue` jumps to the next iteration.
- Positions run from 0 to `Length - 1`, so the usual condition is `i < Length`.
- Keep accumulators outside the loop, and make sure every loop changes what its condition tests.

## Further reading

- [Microsoft Learn: Iteration statements](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/iteration-statements)
- [Microsoft Learn: Jump statements](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/jump-statements)
- [Microsoft Learn: Branches and loops tutorial](https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/tutorials/branches-and-loops)
