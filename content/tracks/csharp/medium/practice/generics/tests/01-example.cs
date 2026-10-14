// The example from the instructions.
Check.Equal(Shelter.Clamp(12, 0, 10), 10, "12 kept between 0 and 10");
Check.Equal(Shelter.Clamp(2.5, 0.0, 10.0), 2.5, "2.5 kept between 0.0 and 10.0");
Check.Equal(Shelter.Clamp("zebra", "ant", "moth"), "moth", "zebra kept between ant and moth");

Check.Equal(Shelter.CountOf(new[] { 3, 1, 3, 3 }, 3), 3, "how many times 3 appears in 3, 1, 3, 3");
Check.Equal(Shelter.CountOf(new string?[] { "Rex", null, "Rex" }, null), 1, "how many items are null in Rex, null, Rex");

var dogs = new Kennel<Dog>();
Dog rex = dogs.Admit("Rex");
Check.Equal(rex.Id, 1, "the id of the first dog admitted");
Check.Equal(dogs.Admit("Fido").Id, 2, "the id of the second dog admitted");
Check.Equal(dogs.Find(2)!.Name, "Fido", "the name of the dog with id 2");
Check.True(dogs.Find(7) is null, "finding id 7 in a kennel of two dogs");
Check.Equal(new Kennel<Cat>().Admit("Tom").Id, 1, "the id of the first cat in a new kennel");
