// The example from the instructions, then what each call costs. Nothing here
// looks at a clock: what is checked is how many bytes a call allocates.

// Calls `work` three times to warm it up, then returns the fewest bytes one
// call allocated, out of three more calls.
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

Check.True(Labels.TryParseDimensions(" 40x30x25 ", out int l, out int w, out int h), "dimensions with spaces around them parse");
Check.Equal((l, w, h), (40, 30, 25), "the sides read from \" 40x30x25 \"");
Check.True(!Labels.TryParseDimensions("40x30", out l, out w, out h), "dimensions with only two parts are rejected");
Check.Equal((l, w, h), (0, 0, 0), "the sides after dimensions were rejected");

char[] label = new char[16];
Check.True(Labels.TryFormatLabel(label, "LHR", 40917, out int written), "a label written into 16 characters");
Check.Equal(written, 12, "the length of the label for parcel 40917 at depot LHR");
Check.Equal(new string(label, 0, written), "LHR-00040917", "the label for parcel 40917 at depot LHR");
Check.True(!Labels.TryFormatLabel(label.AsSpan(0, 6), "LHR", 40917, out written), "a label that does not fit in 6 characters");
Check.Equal(written, 0, "written, after a label that did not fit");

string address = "  12 baker   street\tLondon ";
Check.Equal(Labels.Normalise(address, System.Buffers.ArrayPool<char>.Shared), "12 BAKER STREET LONDON", "the example address, normalised");

// The cost.
bool ok = false;
string text = "";
object? sink = null;
Check.Equal(AllocatedBy(() => ok = Labels.TryParseDimensions(" 40x30x25 ", out l, out w, out h)), 0L,
    "bytes allocated by TryParseDimensions");
Check.Equal(AllocatedBy(() => ok = Labels.TryFormatLabel(label, "LHR", 40917, out written)), 0L,
    "bytes allocated by TryFormatLabel");
long normalise = AllocatedBy(() => text = Labels.Normalise(address, System.Buffers.ArrayPool<char>.Shared));
long result = AllocatedBy(() => sink = new string('x', "12 BAKER STREET LONDON".Length));
Check.True(normalise <= result,
    $"Normalise may allocate the string it returns, {result} bytes, and it allocated {normalise}");
