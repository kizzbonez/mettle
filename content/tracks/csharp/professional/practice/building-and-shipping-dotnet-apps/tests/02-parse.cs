static Version V(string text) => NuGet.ParseVersion(text);

// Every form from the table.
Check.Equal(VersionRange.Parse("1.4.2"), new VersionRange(V("1.4.2"), true, null, false), "a bare version is that version or higher");
Check.Equal(VersionRange.Parse("10.0"), new VersionRange(V("10.0.0"), true, null, false), "a bare version of two numbers");
Check.Equal(VersionRange.Parse("[1.4.2]"), new VersionRange(V("1.4.2"), true, V("1.4.2"), true), "a version in square brackets is exactly that version");
Check.Equal(VersionRange.Parse("[1.0,2.0)"), new VersionRange(V("1.0"), true, V("2.0"), false), "at least 1.0 and below 2.0");
Check.Equal(VersionRange.Parse("(1.0,2.0]"), new VersionRange(V("1.0"), false, V("2.0"), true), "above 1.0 and at most 2.0");
Check.Equal(VersionRange.Parse("(1.0,2.0)"), new VersionRange(V("1.0"), false, V("2.0"), false), "above 1.0 and below 2.0");
Check.Equal(VersionRange.Parse("[1.0,2.0]"), new VersionRange(V("1.0"), true, V("2.0"), true), "from 1.0 to 2.0, both included");
Check.Equal(VersionRange.Parse("[1.0,)"), new VersionRange(V("1.0"), true, null, false), "at least 1.0, with no upper bound");
Check.Equal(VersionRange.Parse("(1.0,)"), new VersionRange(V("1.0"), false, null, false), "above 1.0, with no upper bound");
Check.Equal(VersionRange.Parse("(,2.0)"), new VersionRange(null, false, V("2.0"), false), "below 2.0, with no lower bound");
Check.Equal(VersionRange.Parse("(,2.0]"), new VersionRange(null, false, V("2.0"), true), "at most 2.0, with no lower bound");
Check.Equal(VersionRange.Parse("[1.2.3,1.2.3]"), new VersionRange(V("1.2.3"), true, V("1.2.3"), true), "two equal bounds in square brackets");

// Whitespace.
Check.Equal(VersionRange.Parse("  [1.0, 2.0)  "), new VersionRange(V("1.0"), true, V("2.0"), false), "whitespace around the text and after the comma");
Check.Equal(VersionRange.Parse("[ 1.0 , ]"), new VersionRange(V("1.0"), true, null, false), "whitespace around the bounds, and a missing upper bound");
Check.Equal(VersionRange.Parse(" 6.0.1 "), new VersionRange(V("6.0.1"), true, null, false), "whitespace around a bare version");

// Text that is not a range.
string[] invalid =
[
    "", "   ", "[1.0", "1.0)", "(1.0", "[1.0,2.0", "(1.0)", "(1.0]", "[1.0)", "[1.0,2.0,3.0]", "(,)", "[,]",
    "[2.0,1.0]", "(1.0,1.0)", "[1.0,1.0)", "(1.0,1.0]", "abc", "[abc,2.0)", "1", "[1,2)", "1.0.0.0", "6.*",
];
foreach (string text in invalid)
    Check.Throws<FormatException>(() => VersionRange.Parse(text), $"parsing \"{text}\" throws FormatException");
