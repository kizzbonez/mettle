---
title: "Putting It Together: Reading and Checking Input"
summary: Read input with Console.ReadLine, parse and validate it line by line, report every bad line by its number, and combine the whole level into one small, complete program.
minutes: 30
objectives:
  - Read one line, and then all of standard input, with `Console.ReadLine`, handling `null` at the end
  - Validate each line of text with `Split`, `TryParse` and dictionary lookups, without throwing
  - Report problems by line number while still processing the good lines
  - Combine variables, strings, loops, collections, classes and null handling in one program
---

## Outline

1. Reading a line
2. Reading until the input ends
3. The plan: a café order checker
4. The complete program
5. Walking through it
6. From here to the lab

## Reading a line

`Console.ReadLine()` waits until the user types a line and presses Enter, then returns the text
without the line ending. Its return type is `string?`, because it returns `null` when there is
no more input. Never trust what it returns: check it, then convert it.

```csharp
Console.Write("How many guests? ");
string? text = Console.ReadLine();
if (int.TryParse(text, out int guests) && guests > 0)
{
    int tables = (guests + 3) / 4;
    Console.WriteLine($"{guests} guests need {tables} tables of four.");
}
else
{
    Console.WriteLine($"'{text}' is not a number of guests.");
}
```

Typing `10` and pressing Enter, then running it again and typing `ten`, gives:

```text
How many guests? 10
10 guests need 3 tables of four.
How many guests? ten
'ten' is not a number of guests.
```

`TryParse` accepts a `string?` and simply returns `false` for `null`, so the end of the input
needs no special case here. `(guests + 3) / 4` rounds up with integer division: 10 guests need
3 tables, not 2.

## Reading until the input ends

*Standard input* is the stream of text a program reads: what you type, or a file sent to it.
Programs that process data read it to the end, which `ReadLine` signals by returning `null`:

```csharp
int lineCount = 0;
int words = 0;
while (true)
{
    string? line = Console.ReadLine();
    if (line is null)
    {
        break;
    }
    lineCount++;
    words += line.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
}
Console.WriteLine($"{lineCount} lines, {words} words");
```

Given a file `poem.txt` with the three lines `the quick brown fox`, an empty line and
`jumps over`, run in bash with `cat poem.txt | dotnet run count.cs`, or in PowerShell with
`Get-Content poem.txt | dotnet run count.cs`, it prints:

```text
3 lines, 6 words
```

When you type the input yourself, end it with Ctrl+Z then Enter on Windows, or Ctrl+D on macOS
and Linux. The empty line was counted: an empty line is `""`, not `null`.

## The plan: a café order checker

A café's tablets write orders as text, one item per line: an amount and an item, such as
`2 latte`. Lines starting with `#` are notes. The program must:

1. read all lines,
2. skip notes and blank lines,
3. check each remaining line and report the problems by line number, without stopping,
4. add up the good lines and print a receipt, sorted and aligned, with money as `decimal`.

The rules live in a class, `Order`, so the program's top-level statements only connect input to
output. A method that takes the lines as a `List<string>` can also be tested without typing.

## The complete program

```csharp
using System.Globalization;
using System.Text;

Dictionary<string, decimal> menu = new(StringComparer.OrdinalIgnoreCase)
{
    ["espresso"] = 2.20m,
    ["latte"] = 3.10m,
    ["scone"] = 2.75m,
};

List<string> lines = [];
while (true)
{
    string? line = Console.ReadLine();
    if (line is null)
    {
        break;
    }
    lines.Add(line);
}

var order = new Order(menu);
foreach (string problem in order.ReadLines(lines))
{
    Console.WriteLine(problem);
}
Console.WriteLine(order.Receipt());

class Order
{
    private readonly Dictionary<string, decimal> _menu;
    private readonly Dictionary<string, int> _quantities = new();

    public Order(Dictionary<string, decimal> menu) => _menu = menu;

    public List<string> ReadLines(List<string> lines)
    {
        var problems = new List<string>();
        for (int i = 0; i < lines.Count; i++)
        {
            string line = lines[i].Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }
            string[] fields = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (fields.Length != 2)
            {
                problems.Add($"line {i + 1}: expected an amount and an item");
            }
            else if (!int.TryParse(fields[0], out int amount) || amount < 1)
            {
                problems.Add($"line {i + 1}: '{fields[0]}' is not an amount");
            }
            else if (!_menu.ContainsKey(fields[1]))
            {
                problems.Add($"line {i + 1}: no {fields[1]} on the menu");
            }
            else
            {
                string item = fields[1].ToLowerInvariant();
                _quantities[item] = _quantities.GetValueOrDefault(item) + amount;
            }
        }
        return problems;
    }

    public string Receipt()
    {
        var items = new List<string>(_quantities.Keys);
        items.Sort();
        var text = new StringBuilder();
        decimal total = 0;
        foreach (string item in items)
        {
            decimal cost = _quantities[item] * _menu[item];
            total += cost;
            text.AppendLine(string.Create(CultureInfo.InvariantCulture, $"{_quantities[item],3} {item,-10}{cost,7:F2}"));
        }
        text.Append(string.Create(CultureInfo.InvariantCulture, $"    {"Total",-10}{total,7:F2}"));
        return text.ToString();
    }
}
```

With this `order.txt` sent to standard input:

```text
# table 4
2 latte
1 scone
two espresso

1 Espresso
3 muffin
1 LATTE extra
```

it prints:

```text
line 4: 'two' is not an amount
line 7: no muffin on the menu
line 8: expected an amount and an item
  1 espresso     2.20
  2 latte        6.20
  1 scone        2.75
    Total       11.15
```

## Walking through it

- **Reading** (lesson 12): `ReadLine` returns `string?`. The `is null` check ends the loop, and
  after it the compiler knows `line` is a real string.
- **Numbering** (lessons 7 and 9): the loop index `i` counts every line, including skipped ones,
  and `i + 1` is the number a person sees in an editor. Notes and blank lines are skipped before
  anything is split.
- **Checking in order** (lessons 5, 4 and 10): the field count first, then the amount with
  `TryParse`, then the menu with `ContainsKey`. The first failed check adds one message and
  moves on, so one bad line never stops the rest. No step can throw.
- **Ignoring case** (lesson 10): the menu was created with `StringComparer.OrdinalIgnoreCase`,
  so `Espresso` is found. The item is stored in lower case so that `espresso` and `Espresso` add
  up together.
- **Counting** (lesson 10): `GetValueOrDefault(item) + amount` adds to the running quantity.
- **Money and formatting** (lessons 4 and 5): prices are `decimal`, and the receipt uses widths,
  `F2` and the invariant culture, so it looks the same on every computer.
- **Classes** (lesson 11): `Order` keeps its dictionaries private and offers two public methods.
  `readonly` on a field means it can only be assigned in its declaration or the constructor.

## From here to the lab

The lab of this level asks for the same shape with stricter rules: a class that enforces the
rules of a tool library and throws the right exception when a request breaks them, and a
`Replay` method that reads a whole log, skips notes and blank lines, numbers every line, and
returns the numbers of the lines it could not apply, without ever throwing. Read its
instructions slowly. They state the exact order of the checks, which exceptions to throw, and
the exact text `Describe` returns, and the tests check every one of those statements.

## Common mistakes

- **Not checking for `null`.** `Console.ReadLine().Trim()` gives warning CS8602 and crashes at
  the end of the input.
- **Numbering only the lines you keep.** Count every line, then decide what to skip.
- **Splitting before deciding to skip.** A note may contain anything, including separators.
- **Stopping at the first bad line.** Record the problem and `continue`.
- **Using `Parse` on input.** One bad line throws. Use `TryParse`.
- **Culture-dependent output.** A receipt formatted with the current culture changes from one
  computer to another.

## Practice

1. Change the guests program so that it asks again until it receives a valid number. Which loop
   fits best?
2. Add a check to `ReadLines` that rejects amounts above 20 with the message
   `line N: too many` and test it with the line `30 latte`.
3. Why does `1 LATTE extra` produce "expected an amount and an item" rather than "no LATTE on
   the menu"?

### Answers

**1.** A `do` loop, because the question must be asked at least once:

```csharp
int guests;
string? text;
do
{
    Console.Write("How many guests? ");
    text = Console.ReadLine();
} while (!int.TryParse(text, out guests) || guests < 1);
Console.WriteLine($"{guests} guests");
```

Typing `ten`, then `0`, then `6`:

```text
How many guests? ten
How many guests? 0
How many guests? 6
6 guests
```

A real program should also stop when `text` is `null`, or it would ask forever once the input
has ended.

**2.** Add a branch after the amount check: `else if (amount > 20) { problems.Add($"line {i +
1}: too many"); }`. `amount` is still in scope there, because it was declared in an earlier
condition of the same `if` chain. With `30 latte` as line 1, the output starts with
`line 1: too many`.

**3.** The field count is checked first, and that line has three fields. The order of the checks
decides which problem is reported.

## Key takeaways

- `Console.ReadLine()` returns `string?`: the line without its ending, or `null` when the input
  is over.
- Convert text once, at the edge of the program, with `TryParse` and lookups that cannot throw.
- Number every line, skip after numbering, report each problem, and keep going.
- Small classes with private data and clear public methods turn a script into a program you can
  test.

## Further reading

- [Microsoft Learn: Console.ReadLine](https://learn.microsoft.com/en-us/dotnet/api/system.console.readline)
- [Microsoft Learn: Build file-based apps, including standard input](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/file-based-programs)
- [Microsoft Learn: How to convert a string to a number](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/how-to-convert-a-string-to-a-number)
