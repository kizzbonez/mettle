The tests call the three methods of the class `Campsite`. Each method is nearly complete: write
only where a comment says `YOUR CODE`, and keep the last line of each one, `return ...;`, which
hands the result back to the tests. The names in the parentheses of a method, such as `nights`,
are variables that the tests fill in before your code runs. Use them like any other variable.
Lesson 8 explains the rest of the first line of each method, so leave it as it is.

1. `StayCost(int nights)` is what a stay costs. Inside the method, declare a constant named
   `PricePerNight` of type `decimal` with the value `18.50`, and multiply `nights` by it instead
   of by `0m`.
2. `NextPitchSign(int lastTaken)` points a guest to the pitch after the last one taken. For `7`
   the starter gives `"Next free pitch: 71"`, because `+` joins text from left to right. Fix it
   so that the number in the sign is `lastTaken` plus one.
3. `TentTag(string guest, int nights, char field, bool dog)` builds the tag with string
   interpolation. Its parts, from left to right, are separated by ` | ` (a space, a bar and a
   space):
   - the guest's name;
   - `nights: ` followed by the number of nights;
   - `field: ` followed by the field letter;
   - `dog: ` followed by `dog`, which prints as `True` or `False`.

Example:

```csharp
Campsite.StayCost(3)                           // 55.50
Campsite.NextPitchSign(7)                      // "Next free pitch: 8"
Campsite.TentTag("Ada Okafor", 3, 'B', true)   // "Ada Okafor | nights: 3 | field: B | dog: True"
```

**Tip:** a `decimal` value ends in `m`, as in the lesson's table. Without it, `18.50` is a
`double`, and the compiler refuses to store it in a `decimal`.
