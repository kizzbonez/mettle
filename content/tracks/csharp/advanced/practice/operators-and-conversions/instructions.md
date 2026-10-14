The fields, properties and `ToString` methods are complete in the starter. Write the operator and
equality bodies.

1. `Duration`, a `readonly record struct` with a private constructor, holds a whole number of
   `Seconds`.
   - `explicit operator Duration(int seconds)`: a duration of that many seconds. Throw
     `ArgumentOutOfRangeException` when `seconds` is negative. It is explicit because it can fail.
   - `implicit operator TimeSpan(Duration duration)`: the same length as a `TimeSpan`. It is
     implicit because it always works and loses nothing.
   - `operator +(Duration left, Duration right)`: a new duration as long as both together.
2. `TrackCode` is a class whose constructor trims and upper-cases the code. Two track codes are
   equal when their `Code` is equal. Write `Equals(TrackCode?)`, `Equals(object?)`,
   `GetHashCode()`, `==` and `!=` so that all five agree. `==` must work with `null` on either
   side: two nulls are equal, and a null is never equal to a code.
3. `Playlist`: write the C# 14 compound assignment operator `public void operator +=(Duration
   track)`. It adds one track to **this** playlist: `Count` goes up by one and `Length` grows by
   `track`. It changes the playlist itself and creates no new one.

Example:

```csharp
var opener = (Duration)185;
opener                                  // 3:05
TimeSpan asTime = opener;               // 00:03:05, no cast needed
opener + (Duration)70                   // 4:15
(Duration)(-1)                          // throws ArgumentOutOfRangeException

var a = new TrackCode("ab-12");
var b = new TrackCode(" AB-12 ");
a == b                                  // True
a != b                                  // False
a.Equals((object)b)                     // True
new HashSet<TrackCode> { a, b }.Count   // 1
a == null                               // False

var show = new Playlist("Night Owls");
Playlist sameShow = show;
show += opener;
show += (Duration)70;
show.Count                              // 2
show.Length                             // 4:15
ReferenceEquals(show, sameShow)         // True: += changed the playlist itself
```

**Tip:** let everything funnel into `Equals(TrackCode?)`, and handle `null` in `==` before you
call it. Base the hash code on the same value as equality.
