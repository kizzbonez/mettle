---
title: Arrays and Lists
summary: Store sequences of values in fixed-size arrays and growable List<T> collections, add, remove, search and sort them, loop over them safely, and understand that both are references.
minutes: 30
objectives:
  - Create arrays and lists, read and write elements by index, and explain their default values
  - Add, insert, remove, search and sort with the methods of `List<T>` and `Array`
  - Loop over a collection with `for` and `foreach`, and remove elements without breaking the loop
  - Explain why assigning an array or list to another variable does not copy it
---

## Outline

1. Arrays
2. Lists
3. Looping and adding up
4. Index errors
5. Changing a list while looping over it
6. Two names, one list
7. Array or list?

## Arrays

An **array** holds a fixed number of values of one type, called its **elements**. Each element
has an **index**, its position, starting at 0:

```csharp
int[] seats = new int[4];
seats[0] = 12;
seats[3] = 7;
Console.WriteLine(string.Join(", ", seats));
string[] films = ["Alien", "Up", "Heat"];
Console.WriteLine($"{films.Length} films, first {films[0]}, last {films[films.Length - 1]}, also {films[^1]}");
Array.Sort(films);
Console.WriteLine(string.Join(", ", films));
Console.WriteLine(Array.IndexOf(films, "Up"));
Console.WriteLine(Array.IndexOf(films, "Jaws"));
```

```text
12, 0, 0, 7
3 films, first Alien, last Heat, also Heat
Alien, Heat, Up
2
-1
```

- `int[]` reads "array of `int`". `new int[4]` creates four elements, each holding the type's
  **default value**: 0 for numbers, `false` for `bool`, and `null`, meaning "no object", for
  strings. Lesson 12 is about `null`.
- `["Alien", "Up", "Heat"]` is a **collection expression**: it creates the array with these
  elements. Older code writes `new[] { "Alien", "Up", "Heat" }`.
- `Length` is the number of elements. It never changes after the array is created.
- `^1` means "first from the end", so `films[^1]` is the last element.
- `Array.Sort` sorts in place, and `Array.IndexOf` returns the position of a value, or -1.

## Lists

Most programs do not know in advance how many values they will collect. A **list**,
`List<T>`, grows and shrinks as needed. The `<T>` is a **type parameter**: you choose the
element type when you use it, as in `List<string>` or `List<int>`, and the compiler then allows
only that type in. Types with type parameters are called *generics*, and a later level shows how
to write your own.

```csharp
List<string> queue = ["Mia", "Tom"];
queue.Add("Ravi");
queue.Insert(0, "Zoe");
Console.WriteLine($"{queue.Count}: {string.Join(", ", queue)}");
bool removed = queue.Remove("Tom");
bool removedAgain = queue.Remove("Tom");
Console.WriteLine($"{removed} {removedAgain}: {string.Join(", ", queue)}");
queue.RemoveAt(0);
Console.WriteLine(string.Join(", ", queue));
Console.WriteLine(queue.Contains("Ravi"));
Console.WriteLine(queue.IndexOf("Ravi"));
queue[0] = "Mina";
queue.Sort();
Console.WriteLine(string.Join(", ", queue));
```

```text
4: Zoe, Mia, Tom, Ravi
True False: Zoe, Mia, Ravi
Mia, Ravi
True
1
Mina, Ravi
```

| Member | What it does |
| --- | --- |
| `Add(x)` | appends at the end |
| `Insert(i, x)` | inserts at position `i`, moving the rest along |
| `Remove(x)` | removes the first `x`, returns `false` if there was none |
| `RemoveAt(i)` | removes the element at position `i` |
| `Contains(x)`, `IndexOf(x)` | search, `IndexOf` returns -1 when absent |
| `Count` | the number of elements (arrays say `Length`) |
| `Sort()`, `Reverse()`, `Clear()` | sort, reverse, empty the list in place |

`new List<string>()` and `[]` both create an empty list.

## Looping and adding up

Both kinds of collection work with the loops of lesson 7. Use `for` when you need the index,
and `foreach` when you only need the values:

```csharp
List<int> ticketsSold = [];
ticketsSold.Add(120);
ticketsSold.Add(95);
ticketsSold.Add(143);
int total = 0;
int busiest = 0;
for (int i = 0; i < ticketsSold.Count; i++)
{
    total += ticketsSold[i];
    if (ticketsSold[i] > ticketsSold[busiest])
    {
        busiest = i;
    }
}
Console.WriteLine($"{total} tickets, busiest show #{busiest + 1}");
```

```text
358 tickets, busiest show #3
```

`busiest` remembers the *index* of the largest value seen so far, so the loop needs `for`. People
count shows from 1, hence `busiest + 1`.

## Index errors

Reading or writing outside the valid positions stops the program. An array throws
`IndexOutOfRangeException`, as you saw in lesson 7, and a list throws a differently named
exception for the same mistake:

```csharp
List<string> queue = ["Mia", "Tom"];
Console.WriteLine(queue[2]);
```

```text
Unhandled exception. System.ArgumentOutOfRangeException: Index was out of range. Must be non-negative and less than the size of the collection. (Parameter 'index')
   at System.Collections.Generic.List`1.get_Item(Int32 index)
   at Program.<Main>$(String[] args) in /home/ada/cinema/Program.cs:line 2
```

The valid indexes are 0 to `Count - 1`. An array has no `Add`: `seats.Add(4)` is error CS1061,
"'int[]' does not contain a definition for 'Add'". When you need to add, use a list.

## Changing a list while looping over it

`foreach` refuses to continue when the list changes under it:

```csharp
List<int> sold = [120, 0, 95, 0, 143];
foreach (int s in sold)
{
    if (s == 0)
    {
        sold.Remove(s);
    }
}
```

```text
Unhandled exception. System.InvalidOperationException: Collection was modified; enumeration operation may not execute.
   at System.Collections.Generic.List`1.Enumerator.MoveNext()
   at Program.<Main>$(String[] args) in /home/ada/cinema/Program.cs:line 2
```

To remove while looping, walk the indexes **backwards** with `for`. Removing an element moves
only the elements after it, which the loop has already visited:

```csharp
List<int> sold = [120, 0, 95, 0, 143];
for (int i = sold.Count - 1; i >= 0; i--)
{
    if (sold[i] == 0)
    {
        sold.RemoveAt(i);
    }
}
Console.WriteLine(string.Join(", ", sold));
```

```text
120, 95, 143
```

## Two names, one list

Arrays and lists are **reference types**: a variable holds a *reference* to the collection, not
the elements themselves. Assigning it to another variable copies the reference, so both names
refer to the same collection:

```csharp
int[] original = [1, 2, 3];
int[] alias = original;
alias[0] = 99;
Console.WriteLine(original[0]);
List<string> first = ["x"];
List<string> copy = new List<string>(first);
copy.Add("y");
Console.WriteLine($"{first.Count} {copy.Count}");
```

```text
99
1 2
```

`new List<string>(first)` creates a real copy with the same elements. The same applies to
methods. Passing a list by value, as in lesson 8, copies the *reference*, so a method that
receives a list can add to or change the caller's list.

## Array or list?

Use an array when the number of elements is fixed and known, such as the seven days of a week or
the result of `Split`. Use a `List<T>` whenever elements are added or removed. Lists are the
everyday choice.

## Common mistakes

- **Using `Length` on a list or `Count` on an array.** Arrays have `Length`, lists have `Count`.
- **`i <= list.Count`** in a loop: the last index is `Count - 1`.
- **Removing inside `foreach`.** Loop backwards with `for`, or collect what to remove first.
- **Expecting `=` to copy.** It copies the reference. Create a new list from the old one.
- **Ignoring the result of `Remove` and `IndexOf`.** `false` and -1 mean "not found".

## Practice

1. Count how many ratings in `[4, 5, 3, 5, 2]` are 5.
2. Sort the list `["bo", "Al", "cy"]` and print it joined with commas. Why is `Al` first?
3. Given `int[] grid = [3, 1, 2];`, make a sorted copy and leave `grid` unchanged.

### Answers

```csharp
int[] ratings = [4, 5, 3, 5, 2];
int fives = 0;
foreach (int r in ratings)
{
    if (r == 5)
    {
        fives++;
    }
}
Console.WriteLine(fives);
List<string> names = ["bo", "Al", "cy"];
names.Sort();
Console.WriteLine(string.Join(",", names));
int[] grid = [3, 1, 2];
int[] sorted = (int[])grid.Clone();
Array.Sort(sorted);
Console.WriteLine($"{string.Join(",", grid)} {string.Join(",", sorted)}");
```

```text
2
Al,bo,cy
3,1,2 1,2,3
```

**2.** Strings sort alphabetically, and `"Al"` comes before `"bo"` because a comes before b.
**3.** `Clone()` makes a new array with the same elements. The cast `(int[])` is needed because
`Clone` is declared to return a general `object`.

## Key takeaways

- Arrays have a fixed `Length`. Lists grow, and report their size in `Count`. Both index from 0.
- `Add`, `Insert`, `Remove`, `RemoveAt`, `Contains`, `IndexOf` and `Sort` cover most list work.
- Going outside the indexes throws. Changing a list inside `foreach` throws.
- Arrays and lists are references: assignment shares, `new List<T>(other)` copies.

## Further reading

- [Microsoft Learn: Arrays](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/arrays)
- [Microsoft Learn: Data collections tutorial](https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/tutorials/list-collection)
- [Microsoft Learn: The generic List class](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1)
