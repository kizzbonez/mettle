// Valid lines, including the edges of the format.
(string Line, Reading Expected)[] valid =
[
    ("M-1,0,0", new Reading(1, 0, 0m)),
    ("M-000000007,1760421600,12", new Reading(7, 1760421600, 12m)),
    ("M-999999999,1760421600,0.5", new Reading(999999999, 1760421600, 0.5m)),
    ("  M-00412,1760421600,1532.75\r", new Reading(412, 1760421600, 1532.75m)),
    ("M-00412,99999999999,1532.750", new Reading(412, 99999999999, 1532.75m)),
];
foreach (var (line, expected) in valid)
{
    Check.True(MeterLine.TryParse(line, out Reading actual), $"a valid line is accepted: \"{line.Trim()}\"");
    Check.Equal(actual, expected, $"the reading parsed from \"{line.Trim()}\"");
}

// Malformed lines are rejected, and the reading is left at its default value.
string[] invalid =
[
    "",
    "M-00412,1760421600",
    "M-00412,1760421600,1532.75,extra",
    "00412,1760421600,1532.75",
    "m-00412,1760421600,1532.75",
    "M-,1760421600,1532.75",
    "M-1234567890,1760421600,1532.75",
    "M-12a,1760421600,1532.75",
    "M-00412,-5,1532.75",
    "M-00412,,1532.75",
    "M-00412, 1760421600,1532.75",
    "M-00412,1760421600,-3",
    "M-00412,1760421600,",
    "M-00412,1760421600,1e3",
    "M-00412,1760421600,12 litres",
];
foreach (string line in invalid)
{
    Check.True(!MeterLine.TryParse(line, out Reading rejected), $"a malformed line is rejected: \"{line}\"");
    Check.Equal(rejected, default(Reading), $"the reading after rejecting \"{line}\"");
}

// No heap allocation per line, for good lines or bad ones.
string[] good = Enumerable.Range(1, 1_000).Select(i => $"M-{i:D5},{1760400000 + i},{i}.25").ToArray();
string[] bad = Enumerable.Range(1, 1_000).Select(i => $"M-{i:D5},{1760400000 + i},{i}x25").ToArray();
foreach (string line in good) MeterLine.TryParse(line, out _);
foreach (string line in bad) MeterLine.TryParse(line, out _);

long before = GC.GetAllocatedBytesForCurrentThread();
decimal sum = 0;
foreach (string line in good)
    if (MeterLine.TryParse(line, out Reading parsed)) sum += parsed.Litres;
long goodBytes = GC.GetAllocatedBytesForCurrentThread() - before;

before = GC.GetAllocatedBytesForCurrentThread();
int rejectedCount = 0;
foreach (string line in bad)
    if (!MeterLine.TryParse(line, out _)) rejectedCount++;
long badBytes = GC.GetAllocatedBytesForCurrentThread() - before;

Check.Equal(sum, 500_750m, "sum of litres over the 1,000 generated lines");
Check.Equal(rejectedCount, 1_000, "generated malformed lines rejected");
Check.Equal(goodBytes, 0L, "bytes allocated while parsing 1,000 valid lines");
Check.Equal(badBytes, 0L, "bytes allocated while rejecting 1,000 malformed lines");
