The record `Leg` is complete: do not change it. The static class `TripExtensions` declares every
extension member already, one as a classic `this` method and the others in C# 14 extension
blocks. Write their bodies.

1. **`string Code(this string place)`** is a classic extension method. It trims the place name and
   returns its first three characters in capitals: `Lisbon` gives `LIS`. A name shorter than
   three characters is returned whole, in capitals.
2. **`TimeSpan.Clock`** is an extension property: the whole hours, `h`, and the minutes in two
   digits, such as `2h05`. Hours are not wrapped at a day, so 26 hours is `26h00`, and seconds are
   left out.
3. **`TimeSpan.Driving(double km, double kmPerHour)`** is a static extension member, called on the
   type itself like `TimeSpan.FromHours`. It returns the time it takes to drive `km` at
   `kmPerHour`, rounded to the nearest whole minute. `kmPerHour` is always positive.
4. Two members for any `IEnumerable<Leg>`, so that they work on arrays and lists alike:
   - `double TotalKm` is an extension property: the kilometres of all the legs added up.
   - `string Route()` is the code of the first leg's start followed by the code of every leg's
     end, joined with ` > `. The legs follow one another. No legs give an empty string. Use your
     `Code` extension.

Example:

```csharp
"Lisbon".Code()                       // "LIS"
" ely ".Code()                        // "ELY"
new TimeSpan(2, 5, 0).Clock           // "2h05"
TimeSpan.Driving(150, 100)            // a TimeSpan of 90 minutes
TimeSpan.Driving(100, 70).Clock       // "1h26": 85.7 minutes rounds to 86

Leg[] trip =
[
    new Leg("Lisbon", "Porto", 313, new TimeSpan(3, 5, 0)),
    new Leg("Porto", "Madrid", 561, new TimeSpan(5, 40, 0)),
];
trip.TotalKm                          // 874
trip.Route()                          // "LIS > POR > MAD"
new List<Leg>().Route()               // ""
```
