var cats = new Kennel<Cat>();
Check.Equal(cats.Count, 0, "a new kennel holds no animals");
Check.True(cats.Find(1) is null, "finding id 1 in an empty kennel");

Cat tom = cats.Admit("Tom");
Cat kit = cats.Admit("Kit");
Cat ivy = cats.Admit("Ivy");
Check.Equal(cats.Count, 3, "the number of animals after three were admitted");
Check.Equal(tom.Name, "Tom", "Admit gives the animal its name");
Check.Equal(tom.Sound, "meow", "Admit creates an animal of the kennel's own kind");
Check.Equal(kit.Id, 2, "the second animal admitted gets id 2");
Check.Equal(ivy.Id, 3, "the third animal admitted gets id 3");
Check.True(ReferenceEquals(cats.Find(1), tom), "Find returns the animal object that Admit returned");
Check.True(ReferenceEquals(cats.Find(3), ivy), "Find returns the last animal admitted");
Check.True(cats.Find(0) is null, "no animal has id 0");
Check.True(cats.Find(4) is null, "no animal has an id that has not been given yet");
Check.True(cats.Find(-1) is null, "no animal has a negative id");

// Two animals may share a name; their ids tell them apart.
Cat second = cats.Admit("Tom");
Check.Equal(second.Id, 4, "an animal with a name that is already used gets the next id");
Check.True(ReferenceEquals(cats.Find(4), second), "Find tells two animals with one name apart by id");
Check.True(!ReferenceEquals(second, tom), "Admit creates a new animal every time");

// Every kennel numbers its own animals.
var block = new Kennel<Dog>();
var annex = new Kennel<Dog>();
Check.Equal(block.Admit("Bo").Id, 1, "the first dog in one kennel");
Check.Equal(block.Admit("Max").Id, 2, "the second dog in that kennel");
Check.Equal(annex.Admit("Duke").Id, 1, "a second kennel of dogs counts from 1 as well");
Check.Equal(block.Count, 2, "admitting to the second kennel leaves the first with its own animals");
Check.True(annex.Find(2) is null, "the second kennel does not find the first kennel's animals");
Check.Equal(cats.Count, 4, "the kennel of cats keeps its own count");

// The kennel returns the derived type, so no cast is needed.
Dog duke = annex.Find(1)!;
Check.Equal(duke.Sound, "woof", "a dog found in a kennel of dogs");
