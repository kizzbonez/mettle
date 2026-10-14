var fast = new Runner("Gus", 1500);
var slow = new Runner("Ann", 1600);

// CompareTo: the sign says the order.
Check.True(fast.CompareTo(slow) < 0, "a faster runner sorts before a slower one, whatever their names");
Check.True(slow.CompareTo(fast) > 0, "a slower runner sorts after a faster one");
Check.True(new Runner("Bea", 1500).CompareTo(new Runner("Cal", 1500)) < 0, "on equal times, the name decides");
Check.True(new Runner("Cal", 1500).CompareTo(new Runner("Bea", 1500)) > 0, "on equal times, the name decides, reversed");
Check.True(new Runner("Bea", 1500).CompareTo(new Runner("Bea", 1500)) == 0, "the same name and time sort together");
Check.True(fast.CompareTo(null) > 0, "every runner sorts after null");

// Sort uses CompareTo.
var field = new List<Runner>
{
    new Runner("Max", 1720),
    new Runner("Ivy", 1650),
    new Runner("Kai", 1720),
    new Runner("Joy", 1500),
    new Runner("Hal", 1720),
};
field.Sort();
Check.SequenceEqual(
    field.ConvertAll(runner => runner.Name),
    new[] { "Joy", "Ivy", "Hal", "Kai", "Max" },
    "a field sorted fastest first, with three equal times sorted by name");

// Equals: the same name and the same time.
Check.True(new Runner("Ann", 1600).Equals(slow), "two runner objects with the same name and time");
Check.True(!new Runner("Ann", 1601).Equals(slow), "the same name with another time");
Check.True(!new Runner("Anna", 1600).Equals(slow), "the same time with another name");
Check.True(!slow.Equals((Runner?)null), "a runner compared with null");
Check.True(slow.Equals((object)new Runner("Ann", 1600)), "Equals(object) agrees with the typed Equals");
Check.True(!slow.Equals((object)"Ann"), "a runner compared with a string");
Check.True(!slow.Equals((object?)null), "Equals(object) with null");
Check.True(slow.GetHashCode() == new Runner("Ann", 1600).GetHashCode(), "equal runners have equal hash codes");

// The collections use them.
Check.Equal(field.IndexOf(new Runner("Kai", 1720)), 3, "IndexOf finds an equal runner object");
Check.True(!field.Contains(new Runner("Kai", 1721)), "Contains does not find a runner with another time");
var finishers = new HashSet<Runner> { slow };
Check.True(finishers.Contains(new Runner("Ann", 1600)), "a HashSet finds an equal runner object");
Check.True(!finishers.Add(new Runner("Ann", 1600)), "a HashSet refuses a second equal runner");
