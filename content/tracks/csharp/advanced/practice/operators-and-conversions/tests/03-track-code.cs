var lower = new TrackCode("jz-7");
var upper = new TrackCode("JZ-7");
var spaced = new TrackCode("  jz-7\t");
var other = new TrackCode("JZ-8");

// == and != agree with each other.
Check.True(lower == upper && upper == spaced, "codes that differ only in case and spaces are equal with ==");
Check.True(!(lower != upper), "!= is false for equal codes");
Check.True(lower != other, "!= is true for different codes");
Check.True(!(lower == other), "== is false for different codes");
Check.True(!ReferenceEquals(lower, upper), "equal codes are still separate objects");

// Both Equals methods.
Check.True(lower.Equals(upper), "Equals(TrackCode) for equal codes");
Check.True(!lower.Equals(other), "Equals(TrackCode) for different codes");
object boxed = spaced;
Check.True(lower.Equals(boxed), "Equals(object) for an equal code seen as an object");
Check.True(!lower.Equals((object)"JZ-7"), "a code is not equal to a string with the same text");
Check.True(!lower.Equals((TrackCode?)null), "Equals(TrackCode) with null");
Check.True(!lower.Equals((object?)null), "Equals(object) with null");

// null on either side of == and !=.
TrackCode? missing = null;
TrackCode? alsoMissing = null;
try
{
    Check.True(!(lower == missing), "a code == null");
    Check.True(!(missing == lower), "null == a code");
    Check.True(missing == alsoMissing, "null == null");
    Check.True(lower != missing && missing != lower, "a code and null are different with !=");
    Check.True(!(missing != alsoMissing), "null != null");
}
catch (NullReferenceException)
{
    Check.True(false, "== and != accept null on either side without using it as an object");
}

// Hash codes agree with equality, so collections see equal codes as one.
Check.Equal(lower.GetHashCode(), spaced.GetHashCode(), "the hash codes of two equal codes");
var set = new HashSet<TrackCode> { lower, upper, spaced, other };
Check.Equal(set.Count, 2, "a set of three equal codes and one different code");
var minutes = new Dictionary<TrackCode, int> { [new TrackCode("ab-1")] = 4 };
Check.True(minutes.ContainsKey(new TrackCode(" AB-1")), "a dictionary finds a key typed differently");
Check.Equal(new List<TrackCode> { other, upper }.IndexOf(spaced), 1, "List.IndexOf finds an equal code through Equals");
Check.True(new[] { other, lower }.Contains(spaced), "Contains finds an equal code");
