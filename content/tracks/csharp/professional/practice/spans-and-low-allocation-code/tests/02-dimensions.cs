static long AllocatedBy(Action work)
{
    for (int i = 0; i < 3; i++) work();
    long fewest = long.MaxValue;
    for (int i = 0; i < 3; i++)
    {
        long before = GC.GetAllocatedBytesForCurrentThread();
        work();
        fewest = Math.Min(fewest, GC.GetAllocatedBytesForCurrentThread() - before);
    }
    return fewest;
}

static (bool Ok, int Length, int Width, int Height) Parse(string text)
{
    bool ok = Labels.TryParseDimensions(text, out int length, out int width, out int height);
    return (ok, length, width, height);
}

// Valid dimensions.
Check.Equal(Parse("1x1x1"), (true, 1, 1, 1), "the smallest dimensions");
Check.Equal(Parse("120x80x60"), (true, 120, 80, 60), "dimensions with no whitespace");
Check.Equal(Parse("\t120x80x60\r\n"), (true, 120, 80, 60), "dimensions with a tab before and a line ending after");
Check.Equal(Parse("007x10x2"), (true, 7, 10, 2), "a side written with leading zeros");
Check.Equal(Parse("2147483647x1x1"), (true, int.MaxValue, 1, 1), "the largest side an int can hold");

// Invalid dimensions: false, and every side 0.
string[] invalid =
[
    "", "   ", "40", "40x30", "40x30x25x10", "40X30X25", "40*30*25",
    "40x-3x25", "40x+3x25", "40x3.5x25", "40 x30x25", "40x30x 25", "4 0x30x25",
    "0x10x10", "40x0x25", "40x30x00", "x30x25", "40x30x", "40xx25", "x", "xx",
    "2147483648x1x1", "40x30x25cm", "４０x30x25",
];
foreach (string text in invalid)
    Check.Equal(Parse(text), (false, 0, 0, 0), $"dimensions \"{text}\" are rejected and every side is 0");

// A valid call followed by an invalid one leaves nothing behind.
Check.True(Labels.TryParseDimensions("9x9x9", out int l, out int w, out int h), "dimensions 9x9x9 parse");
Check.True(!Labels.TryParseDimensions("9x9", out l, out w, out h), "dimensions 9x9 are rejected");
Check.Equal((l, w, h), (0, 0, 0), "the sides after a rejected call that followed a valid one");

// The cost, for valid and invalid text.
bool ok = false;
foreach (string text in new[] { "120x80x60", "  2147483647x1x1  ", "40x30", "40x30x25x10", "40x3.5x25", "2147483648x1x1", "" })
{
    string t = text;
    Check.Equal(AllocatedBy(() => ok = Labels.TryParseDimensions(t, out l, out w, out h)), 0L,
        $"bytes allocated by TryParseDimensions for \"{text}\"");
}
