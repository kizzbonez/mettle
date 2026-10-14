`Animal`, `Dog` and `Cat` are complete: do not change them. Write the bodies marked with
`throw new NotImplementedException();`, and add the constraints the `TODO` comments ask for. A
body that uses something the compiler does not know `T` has will not compile until the right
constraint is there.

1. **`Shelter.Clamp<T>(T value, T low, T high)`** returns `low` when the value is below `low`,
   `high` when it is above `high`, and the value itself otherwise. It must work for `int`,
   `double`, `decimal`, `string`, `DateOnly` and any other type that can compare itself with its
   own kind, so constrain `T` to `IComparable<T>` and use `CompareTo`. `low` is never above `high`.
2. **`Shelter.CountOf<T>(T[] items, T wanted)`** counts the items equal to `wanted`. It has no
   constraint, so `T` may be a value type or a reference type, and items may be `null`. Compare
   with `EqualityComparer<T>.Default.Equals`, which handles all of these.
3. **`Kennel<TAnimal>`** holds one kind of animal. Constrain `TAnimal` to `Animal` and `new()`,
   then write:
   - `TAnimal Admit(string name)` creates a new `TAnimal`, gives it the name and the next id,
     keeps it, and returns it. Each kennel numbers its own animals from `1`.
   - `int Count` is the number of animals in the kennel.
   - `TAnimal? Find(int id)` returns the animal with that id, or `null` if there is none.

Example:

```csharp
Shelter.Clamp(12, 0, 10)                           // 10
Shelter.Clamp(2.5, 0.0, 10.0)                      // 2.5
Shelter.Clamp("zebra", "ant", "moth")              // "moth"

Shelter.CountOf(new[] { 3, 1, 3, 3 }, 3)           // 3
Shelter.CountOf(new string?[] { "Rex", null, "Rex" }, null)   // 1

var dogs = new Kennel<Dog>();
Dog rex = dogs.Admit("Rex");                       // a Dog, with no cast
rex.Id                                             // 1
dogs.Admit("Fido").Id                              // 2
dogs.Find(2)!.Name                                 // "Fido"
dogs.Find(7)                                       // null
new Kennel<Cat>().Admit("Tom").Id                  // 1: every kennel counts from 1
```
