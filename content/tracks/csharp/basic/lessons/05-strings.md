---
title: Strings
summary: Work with text in C#, from indexing and the common string methods to format specifiers, verbatim and raw literals, immutability and a first look at StringBuilder.
minutes: 30
objectives:
  - Read characters and use the common methods of `string` to search, cut, split and join text
  - Format numbers inside interpolated strings with format specifiers and alignment
  - Write strings with escape sequences, verbatim literals and raw string literals
  - Explain why strings are immutable and when to use `StringBuilder`
---

## Outline

1. Characters, length and indexes
2. Strings never change
3. Splitting and joining
4. Formatting values
5. Special characters, verbatim and raw literals
6. Comparing strings
7. Building text with `StringBuilder`

## Characters, length and indexes

A `string` is a sequence of `char` values. `Length` counts them, and `[i]` reads the one at
position `i`, counting from 0. Many methods do the everyday work:

```csharp
string title = "The Night Library";
Console.WriteLine(title.Length);
Console.WriteLine(title[0]);
Console.WriteLine(title[title.Length - 1]);
Console.WriteLine(title.ToUpper());
Console.WriteLine(title.Contains("Night"));
Console.WriteLine(title.Contains("night"));
Console.WriteLine(title.IndexOf("Library"));
Console.WriteLine(title.Substring(4, 5));
Console.WriteLine(title.Replace("Night", "Day"));
Console.WriteLine(title.StartsWith("The"));
```

```text
17
T
y
THE NIGHT LIBRARY
True
False
10
Night
The Day Library
True
```

- The last character is at `Length - 1`, because the first is at 0.
- `Contains` is case-sensitive, so `"night"` is not found.
- `IndexOf` returns the position where the text starts, or -1 when it is absent.
- `Substring(4, 5)` takes 5 characters starting at position 4. Asking for more characters than
  exist throws `ArgumentOutOfRangeException`.
- Other useful members: `ToLower`, `EndsWith`, `Trim` (removes spaces at both ends),
  `TrimStart`, `TrimEnd`, `PadLeft` and the static `string.IsNullOrWhiteSpace(text)`, which is
  `true` for an empty string or one made only of spaces.

## Strings never change

A string is **immutable**: once created, its characters can never change. Methods such as
`Trim` and `ToUpper` return a *new* string and leave the original alone, so their result must be
stored:

```csharp
string code = "  isbn-0451  ";
code.Trim();
Console.WriteLine($"[{code}]");
code = code.Trim().ToUpper();
Console.WriteLine($"[{code}]");
```

```text
[  isbn-0451  ]
[ISBN-0451]
```

The second line threw its result away. The fourth line *chains* two calls, each working on the
string returned by the one before. Writing to a position is not allowed either:
`title[0] = 'J';` is error CS0200, which says that the indexer `string.this[int]` is read only.
Immutability makes strings safe to share: no other part of the program can change a string you
are holding.

## Splitting and joining

`Split` cuts a string at a separator and returns an *array* of strings, a numbered list of
values (lesson 9 covers arrays). `string.Join` does the reverse.

```csharp
string line = "Dune,Herbert,1965";
string[] parts = line.Split(',');
Console.WriteLine(parts.Length);
Console.WriteLine(parts[1]);
string messy = "  Dune , Herbert,, 1965 ";
Console.WriteLine(string.Join("|", messy.Split(',')));
string[] clean = messy.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(string.Join("|", clean));
```

```text
3
Herbert
  Dune | Herbert|| 1965 
Dune|Herbert|1965
```

Two separators in a row produce an empty piece, and spaces stay attached. The options
`TrimEntries` (trim every piece) and `RemoveEmptyEntries` (drop empty pieces) clean that up, and
`|` combines the two options.

## Formatting values

Inside an interpolated string, a colon after the value adds a **format specifier**, and a comma
adds a **width**: positive aligns right, negative aligns left.

```csharp
string book = "Dune";
decimal price = 9.5m;
int copies = 3;
Console.WriteLine($"{book}: {copies} x {price:F2} = {copies * price:F2}");
Console.WriteLine($"Copies: {copies:D4}");
Console.WriteLine($"Big number: {1234567.891:N2}");
Console.WriteLine($"|{book,-8}|{copies,5}|");
Console.WriteLine($"Braces: {{ and }}");
```

```text
Dune: 3 x 9.50 = 28.50
Copies: 0003
Big number: 1,234,567.89
|Dune    |    3|
Braces: { and }
```

| Specifier | Meaning | Example |
| --- | --- | --- |
| `F2` | fixed point, 2 decimals | `9.50` |
| `N2` | with thousands separators, 2 decimals | `1,234,567.89` |
| `D4` | whole number padded with zeros to 4 digits | `0003` |
| `X` | hexadecimal | `FF` for 255 |
| `P1`, `C` | percentage, currency | depend on the culture |

Formatting follows the computer's **culture**, its language and region settings: a German
machine writes `9,50`. Text meant for other programs, such as a file or a report that tests
compare, should use the *invariant culture*, which always writes `9.50`:

```csharp
using System.Globalization;

decimal price = 1234.5m;
Console.WriteLine(price.ToString("F2", CultureInfo.InvariantCulture));
Console.WriteLine(string.Create(CultureInfo.InvariantCulture, $"{price:N2}"));
```

```text
1234.50
1,234.50
```

`using System.Globalization;` imports the namespace that contains `CultureInfo`. It is not one
of the namespaces a console project imports for you.

## Special characters, verbatim and raw literals

In an ordinary string, `\` starts an **escape sequence**: `\n` new line, `\t` tab, `\"` a double
quote, `\\` a backslash. Two other kinds of literal avoid the escaping:

```csharp
Console.WriteLine("Quote: \"Dune\"");
Console.WriteLine("Path: C:\\books\\dune.txt");
Console.WriteLine(@"Path: C:\books\dune.txt");
string label = """
    Shelf 4, row 2:
      "Dune" (1965)
    """;
Console.WriteLine(label);
```

```text
Quote: "Dune"
Path: C:\books\dune.txt
Path: C:\books\dune.txt
Shelf 4, row 2:
  "Dune" (1965)
```

- A **verbatim** literal starts with `@`. Backslashes are ordinary characters, which suits
  Windows paths, and a double quote is written twice: `""`.
- A **raw string literal** starts and ends with at least three double quotes. It can contain
  quotes and line breaks as they are. The closing `"""` sets the left margin: its indentation is
  removed from every line, so the text can be indented with the code.

Both combine with `$` for interpolation.

## Comparing strings

`==` compares the characters, and is case-sensitive. To ignore case, say so:

```csharp
string a = "Dune";
string b = "dune";
Console.WriteLine(a == b);
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase));
Console.WriteLine(char.IsUpper(a[0]));
```

```text
False
True
True
```

`Ordinal` means "compare the character codes", the right choice for ids, codes and file names.
`char` has helpers too: `char.IsDigit`, `char.IsLetter`, `char.IsWhiteSpace`.

## Building text with `StringBuilder`

Because strings are immutable, `text += more` in a loop creates a new string every time and
copies all the old characters into it. For text built from many pieces, use
`System.Text.StringBuilder`, which grows one buffer, and call `ToString()` at the end:

```csharp
using System.Text;

var receipt = new StringBuilder();
receipt.AppendLine("Receipt");
for (int i = 1; i <= 3; i++)
{
    receipt.Append("Item ").Append(i).AppendLine();
}
receipt.Append("Thank you");
Console.WriteLine(receipt.ToString());
```

```text
Receipt
Item 1
Item 2
Item 3
Thank you
```

The `for` loop, which repeats its body for `i` from 1 to 3, is the subject of lesson 7. Each
`Append` returns the builder itself, which is why the calls can be chained. For a few pieces,
interpolation is simpler and perfectly fine.

## Common mistakes

- **Discarding the result.** `name.Trim();` changes nothing. Write `name = name.Trim();`.
- **Off by one.** The last character is `text[text.Length - 1]`, not `text[text.Length]`.
- **Case-sensitive search by accident.** `"Dune".Contains("dune")` is `false`.
- **Backslashes in paths.** `"C:\new"` contains a newline. Use `@"C:\new"`.
- **Culture surprises.** `ToString("F2")` writes a comma on some machines. Pass
  `CultureInfo.InvariantCulture` when another program will read the text.

## Practice

1. Turn `"  grace HOPPER "` into `"Grace hopper"`: trimmed, first letter upper case, the rest
   lower case.
2. Split the product code `"bk-0042-x"` and print `BK #42 (x)`.
3. Print a total of 7.5 right-aligned in 8 characters with two decimals, followed by `|`.

### Answers

```csharp
string tidy = "  grace HOPPER ".Trim();
Console.WriteLine(tidy.Substring(0, 1).ToUpper() + tidy.Substring(1).ToLower());
string[] p = "bk-0042-x".Split('-');
Console.WriteLine($"{p[0].ToUpper()} #{int.Parse(p[1])} ({p[2]})");
decimal total = 7.5m;
Console.WriteLine($"{total,8:F2}|");
```

```text
Grace hopper
BK #42 (x)
    7.50|
```

`Substring(1)` takes everything from position 1 to the end. `int.Parse("0042")` is 42, which
removes the leading zeros. The width comes before the format: `{value,width:format}`.

## Key takeaways

- Strings are indexed from 0 and immutable. Every "change" returns a new string.
- `Split`, `Join`, `Trim`, `Substring`, `IndexOf` and `Replace` cover most text handling.
- `{value,width:format}` aligns and formats. Use the invariant culture for machine-readable text.
- Verbatim `@"..."` and raw `"""..."""` literals avoid escaping. `StringBuilder` builds text from
  many pieces.

## Further reading

- [Microsoft Learn: The string type](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/reference-types)
- [Microsoft Learn: String interpolation](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated)
- [Microsoft Learn: Standard numeric format strings](https://learn.microsoft.com/en-us/dotnet/standard/base-types/standard-numeric-format-strings)
- [Microsoft Learn: Using the StringBuilder class](https://learn.microsoft.com/en-us/dotnet/standard/base-types/stringbuilder)
