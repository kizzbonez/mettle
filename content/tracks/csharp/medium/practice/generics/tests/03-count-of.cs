// Value types.
Check.Equal(Shelter.CountOf(new int[0], 4), 0, "an empty array holds nothing");
Check.Equal(Shelter.CountOf(new[] { 4, 4, 4 }, 4), 3, "every item is the wanted one");
Check.Equal(Shelter.CountOf(new[] { 1, 2, 3 }, 4), 0, "no item is the wanted one");
Check.Equal(Shelter.CountOf(new[] { 0, 5, 0 }, 0), 2, "0 is counted like any other value");
Check.Equal(Shelter.CountOf(new[] { 2.5, 2.50, 3.0 }, 2.5), 2, "doubles are compared by value");
Check.Equal(Shelter.CountOf(new[] { 'a', 'b', 'a' }, 'a'), 2, "chars are compared by value");
Check.Equal(Shelter.CountOf(new[] { (1, "x"), (2, "x"), (1, "x") }, (1, "x")), 2, "tuples are compared element by element");

// Strings and null.
Check.Equal(Shelter.CountOf(new[] { "Rex", "rex", "Rex" }, "Rex"), 2, "strings are compared by their characters, case included");
string built = new string(['R', 'e', 'x']);
Check.Equal(Shelter.CountOf(new[] { "Rex", "Tom" }, built), 1, "an equal string built separately is counted");
Check.Equal(Shelter.CountOf(new string?[] { null, "Tom", null, null }, null), 3, "null items are counted when null is wanted");
Check.Equal(Shelter.CountOf(new string?[] { null, "Tom", null }, "Tom"), 1, "null items are skipped when a string is wanted");
Check.Equal(Shelter.CountOf(new string?[] { null, null }, "Tom"), 0, "an array of nulls holds no string");

// Classes without their own equality are compared by reference.
var rex = new Dog { Id = 1, Name = "Rex" };
var twin = new Dog { Id = 1, Name = "Rex" };
Check.Equal(Shelter.CountOf(new[] { rex, twin, rex }, rex), 2, "the same dog object is counted, an equal-looking one is not");
Check.Equal(Shelter.CountOf(new Animal?[] { rex, null, new Cat() }, null), 1, "a null among animals");
