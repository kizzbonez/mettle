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

// Formats into a buffer of `size` dots and returns the result and the whole buffer.
static (bool Ok, int Written, string Buffer) Format(int size, string depot, int parcel)
{
    char[] buffer = new char[size];
    Array.Fill(buffer, '.');
    bool ok = Labels.TryFormatLabel(buffer, depot, parcel, out int written);
    return (ok, written, new string(buffer));
}

// Numbers of every length.
Check.Equal(Format(20, "LHR", 0), (true, 12, "LHR-00000000........"), "the label of parcel 0, and the buffer after it");
Check.Equal(Format(20, "LHR", 7), (true, 12, "LHR-00000007........"), "the label of parcel 7, and the buffer after it");
Check.Equal(Format(20, "LHR", 12345678), (true, 12, "LHR-12345678........"), "the label of an 8-digit parcel number");
Check.Equal(Format(20, "LHR", 123456789), (true, 13, "LHR-123456789......."), "a 9-digit parcel number keeps every digit");
Check.Equal(Format(20, "LHR", int.MaxValue), (true, 14, "LHR-2147483647......"), "the largest parcel number");

// Depots of other lengths.
Check.Equal(Format(16, "AMS1", 42), (true, 13, "AMS1-00000042..."), "the label of a depot with four characters");
Check.Equal(Format(16, "", 42), (true, 9, "-00000042......."), "the label when the depot is empty");

// Room: exactly enough, and one too few.
Check.Equal(Format(12, "LHR", 40917), (true, 12, "LHR-00040917"), "a label that exactly fills the buffer");
Check.Equal(Format(11, "LHR", 40917).Ok, false, "a label one character longer than the buffer");
Check.Equal(Format(11, "LHR", 40917).Written, 0, "written, after a label one character longer than the buffer");
Check.Equal(Format(4, "LHR", 40917).Ok, false, "a buffer with room for the depot and the hyphen only");
Check.Equal(Format(3, "LHR", 40917).Ok, false, "a buffer with room for the depot only");
Check.Equal(Format(0, "LHR", 40917), (false, 0, ""), "an empty buffer");

Check.Throws<ArgumentOutOfRangeException>(() => Labels.TryFormatLabel(new char[20], "LHR", -1, out _), "a negative parcel number");

// The cost.
char[] label = new char[32];
bool ok = false;
int written = 0;
Check.Equal(AllocatedBy(() => ok = Labels.TryFormatLabel(label, "LHR", 40917, out written)), 0L, "bytes allocated by TryFormatLabel");
Check.Equal(AllocatedBy(() => ok = Labels.TryFormatLabel(label, "AMS1", int.MaxValue, out written)), 0L,
    "bytes allocated by TryFormatLabel for the largest parcel number");
Check.Equal(AllocatedBy(() => ok = Labels.TryFormatLabel(label.AsSpan(0, 5), "LHR", 40917, out written)), 0L,
    "bytes allocated by TryFormatLabel for a label that does not fit");
