Write the three methods of `Labels`. **No test measures time.** What is checked is the result
and how many bytes a call allocates on the managed heap.

1. `bool TryParseDimensions(ReadOnlySpan<char> text, out int length, out int width, out int height)`
   reads dimensions such as `40x30x25`.
   - Ignore whitespace at the start and the end of `text`.
   - There are exactly three parts, separated by a lower-case `x`.
   - Each part is one or more ASCII digits and nothing else (no sign, no spaces), read with the
     invariant culture, and its value is at least 1.
   - Return `true` with the three values, or `false` with all three set to 0.
   - It allocates **nothing**, for valid and invalid text alike.
2. `bool TryFormatLabel(Span<char> destination, ReadOnlySpan<char> depot, int parcel, out int written)`
   writes a tracking label into `destination`: the depot, a hyphen, and the parcel number with
   at least 8 digits, padded with zeros (`LHR-00040917`; a larger number keeps all its digits).
   - On success it returns `true`, sets `written` to the label's length, and leaves the
     characters of `destination` after the label as they were.
   - If the label does not fit, it returns `false` and sets `written` to 0.
   - A negative `parcel` throws `ArgumentOutOfRangeException`.
   - It allocates **nothing**.
3. `string Normalise(ReadOnlySpan<char> address, ArrayPool<char> pool)` cleans up an address:
   whitespace at the start and the end goes, every run of whitespace inside becomes one space,
   and lower-case ASCII letters become upper case. Every other character stays as it is.
   - When `address.Length` is at most `StackLimit` (256), work in a buffer from `stackalloc`
     and do not touch `pool`.
   - When it is longer, rent the buffer from `pool` and return it to `pool` in a `finally`
     block. The array you get may be longer than you asked for and may hold old characters.
   - It allocates **only the string it returns**.

The pool is a parameter so that the tests can watch it: they hand in their own pool, filled
with arrays of old text. Production passes `ArrayPool<char>.Shared`.

Example:

```csharp
Labels.TryParseDimensions(" 40x30x25 ", out int l, out int w, out int h)   // true: 40, 30, 25
Labels.TryParseDimensions("40x30", out l, out w, out h)                     // false: 0, 0, 0

char[] label = new char[16];
Labels.TryFormatLabel(label, "LHR", 40917, out int written)       // true, written 12
new string(label, 0, written)                                     // "LHR-00040917"
Labels.TryFormatLabel(label.AsSpan(0, 6), "LHR", 40917, out written)   // false, written 0

Labels.Normalise("  12 baker   street\tLondon ", ArrayPool<char>.Shared)
                                                  // "12 BAKER STREET LONDON"
```

**Tips**

- `text.Trim()` and slicing return views of the same memory. `MemoryExtensions.Split` on a
  span gives `Range` values: `foreach (Range part in span.Split('x'))`, then `span[part]`.
- `int.TryParse(span, NumberStyles.None, CultureInfo.InvariantCulture, out int value)` accepts
  digits only. `NumberStyles` and `CultureInfo` need `using System.Globalization;`, which the
  starter has.
- `parcel.TryFormat(destination[start..], out int digits, "D8", CultureInfo.InvariantCulture)`
  writes the digits straight into the span.
- `Span<char> buffer = small ? stackalloc char[StackLimit] : (rented = pool.Rent(n));` works,
  and `new string(buffer[..count])` copies only the characters you wrote.
