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

// The rules of the instructions, written the slow and obvious way.
static string Expected(string address)
{
    string joined = string.Join(' ', address.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    return new string(joined.Select(c => c is >= 'a' and <= 'z' ? (char)(c - 'a' + 'A') : c).ToArray());
}

// Puts an array full of '#' into the pool, where the next Rent of that size finds it.
static char[] Seed(System.Buffers.ArrayPool<char> pool, int length)
{
    char[] array = pool.Rent(length);
    Array.Fill(array, '#');
    pool.Return(array);
    return array;
}

var shared = System.Buffers.ArrayPool<char>.Shared;

// What comes out.
Check.Equal(Labels.Normalise("", shared), "", "an empty address");
Check.Equal(Labels.Normalise(" \t\r\n ", shared), "", "an address of whitespace only");
Check.Equal(Labels.Normalise("a", shared), "A", "an address of one lower-case letter");
Check.Equal(Labels.Normalise("10 HIGH ST", shared), "10 HIGH ST", "an address that is already clean");
Check.Equal(Labels.Normalise(" \t10 HIGH ST", shared), "10 HIGH ST", "whitespace at the start of an address goes");
Check.Equal(Labels.Normalise("10 HIGH ST \t\n", shared), "10 HIGH ST", "whitespace at the end of an address goes");
Check.Equal(Labels.Normalise("flat 3b,\r\n  10 high st", shared), "FLAT 3B, 10 HIGH ST",
    "a line break and the spaces after it become one space");
Check.Equal(Labels.Normalise("rue de l'église 5", shared), "RUE DE L'éGLISE 5",
    "only ASCII letters change: a lower-case letter outside ASCII stays as it is");
Check.Equal(Labels.Normalise("  Unit 4 / 77-79 Quay Rd.  ", shared), "UNIT 4 / 77-79 QUAY RD.", "digits and punctuation stay as they are");

// Short addresses never touch the pool.
var quiet = System.Buffers.ArrayPool<char>.Create();
string medium = "  12 baker   street\tlondon ";
char[] unused = Seed(quiet, medium.Length);
Check.Equal(Labels.Normalise(medium, quiet), Expected(medium), "a short address, normalised");
Check.True(unused.All(c => c == '#'), "an address of at most 256 characters is normalised without renting from the pool");

string limit = "b" + new string(' ', 254) + "c";
char[] unusedAtLimit = Seed(quiet, limit.Length);
Check.Equal(Labels.Normalise(limit, quiet), "B C", "an address of exactly 256 characters, normalised");
Check.True(unusedAtLimit.All(c => c == '#'), "an address of exactly 256 characters is normalised without renting from the pool");

// Long addresses work in an array rented from the pool, and give it back.
string justOver = "b" + new string(' ', 255) + "c";
string longAddress = "  " + string.Join("   ", Enumerable.Range(1, 30).Select(i => $"unit {i}\true de l'église")) + " \t ";
foreach (string address in new[] { justOver, longAddress })
{
    var pool = System.Buffers.ArrayPool<char>.Create();
    char[] seeded = Seed(pool, address.Length);
    string normalised = Labels.Normalise(address, pool);
    Check.Equal(normalised, Expected(address), $"an address of {address.Length} characters, normalised, with no old characters from the pool in it");
    Check.True(!seeded.All(c => c == '#'), $"an address of {address.Length} characters is normalised in an array rented from the pool it is given");
    char[] next = pool.Rent(address.Length);
    Check.True(ReferenceEquals(next, seeded), $"after normalising an address of {address.Length} characters, the rented array is back in the pool");
    pool.Return(next);
}

// The cost: the string that is returned, and nothing else.
string text = "";
object? sink = null;
foreach (string address in new[] { medium, limit, justOver, longAddress })
{
    var pool = System.Buffers.ArrayPool<char>.Create();
    Seed(pool, address.Length);
    string expected = Expected(address);
    long bytes = AllocatedBy(() => text = Labels.Normalise(address, pool));
    long result = AllocatedBy(() => sink = new string('x', expected.Length));
    Check.Equal(text, expected, "the address normalised while its allocations were counted");
    Check.True(bytes <= result,
        $"Normalise of an address of {address.Length} characters may allocate the string it returns, {result} bytes, and it allocated {bytes}");
}
