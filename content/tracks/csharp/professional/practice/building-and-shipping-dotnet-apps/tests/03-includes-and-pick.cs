static Version V(string text) => NuGet.ParseVersion(text);
static VersionRange R(string text) => VersionRange.Parse(text);

// The edges of each kind of bound.
Check.True(R("1.4.2").Includes(V("1.4.2")), "1.4.2 includes 1.4.2 itself");
Check.True(R("1.4.2").Includes(V("99.0")), "1.4.2 has no upper bound");
Check.True(!R("1.4.2").Includes(V("1.4.1")), "1.4.2 does not include 1.4.1");
Check.True(R("[1.4.2]").Includes(V("1.4.2")), "[1.4.2] includes 1.4.2");
Check.True(!R("[1.4.2]").Includes(V("1.4.3")) && !R("[1.4.2]").Includes(V("1.4.1")), "[1.4.2] includes nothing else");
Check.True(R("[1.0,2.0)").Includes(V("1.0")), "[1.0,2.0) includes its lower bound");
Check.True(R("[1.0,2.0)").Includes(V("1.99.99")), "[1.0,2.0) includes 1.99.99");
Check.True(!R("[1.0,2.0)").Includes(V("2.0")), "[1.0,2.0) excludes its upper bound");
Check.True(!R("(1.0,2.0]").Includes(V("1.0")), "(1.0,2.0] excludes its lower bound");
Check.True(R("(1.0,2.0]").Includes(V("1.0.1")), "(1.0,2.0] includes 1.0.1");
Check.True(R("(1.0,2.0]").Includes(V("2.0")), "(1.0,2.0] includes its upper bound");
Check.True(R("(,2.0)").Includes(V("0.0.1")), "(,2.0) has no lower bound");
Check.True(!R("(,2.0)").Includes(V("2.0")), "(,2.0) excludes 2.0");
Check.True(R("(,2.0]").Includes(V("2.0")), "(,2.0] includes 2.0");
Check.True(!R("(1.0,)").Includes(V("1.0")) && R("(1.0,)").Includes(V("1.0.1")), "(1.0,) starts just above 1.0");
Check.True(R("[1.10,)").Includes(V("1.10")) && !R("[1.10,)").Includes(V("1.9")), "versions compare by number, so 1.9 is below 1.10");

// The lowest version every range allows.
Version[] feed = [V("2.1.0"), V("1.0.0"), V("1.9.0"), V("1.10.0"), V("3.0.0"), V("2.0.5"), V("1.10.0")];
Check.Equal(NuGet.PickLowest(feed, [R("1.0")]), V("1.0.0"), "the lowest version of an unsorted feed that is at least 1.0");
Check.Equal(NuGet.PickLowest(feed, [R("1.5")]), V("1.9.0"), "the lowest version of an unsorted feed that is at least 1.5");
Check.Equal(NuGet.PickLowest(feed, [R("1.9.1")]), V("1.10.0"), "the lowest version above 1.9.1, where 1.10 comes after 1.9");
Check.Equal(NuGet.PickLowest(feed, [R("1.5"), R("[2.0,3.0)")]), V("2.0.5"), "the lowest version two ranges both allow");
Check.Equal(NuGet.PickLowest(feed, [R("(2.0.5,)"), R("(,3.0]"), R("2.1")]), V("2.1.0"), "the lowest version three ranges all allow");
Check.Equal(NuGet.PickLowest(feed, [R("[3.0.0]")]), V("3.0.0"), "an exact range that the feed has");
Check.Equal(NuGet.PickLowest(feed, [R("[2.0.4]")]), null, "an exact range that the feed does not have");
Check.Equal(NuGet.PickLowest(feed, [R("[1.0,2.0)"), R("[2.0,)")]), null, "two ranges that share no version");
Check.Equal(NuGet.PickLowest([], [R("1.0")]), null, "an empty feed");
Check.Equal(NuGet.PickLowest(feed, []), V("1.0.0"), "no ranges at all: the lowest version of the feed");
