The delegate type `Adjust` is complete: any method or lambda that takes a brightness level and
returns a new one is an `Adjust`. Write the four methods of `Darkroom`, which take behaviour as an
argument or hand it back as a result.

1. **`int[] Apply(int[] levels, Adjust adjust)`** returns a new array with every level passed
   through `adjust`. The array it was given stays as it was.
2. **`Adjust Brighter(int amount)`** returns an adjustment that adds `amount` to a level and keeps
   the result between `0` and `255`. A negative amount makes the picture darker.
3. **`Adjust Chain(params Adjust[] steps)`** returns one adjustment that runs every step in the
   order given, each on the result of the one before. With no steps it returns the level
   unchanged.
4. **`Func<string> Namer(string prefix)`** returns a function that gives a new file name each time
   it is called: the prefix, `_`, and a number counted from `1` and written with at least three
   digits. Every namer counts on its own, even two with the same prefix. A lambda that captures a
   local variable can keep that count between calls.

Example:

```csharp
Adjust invert = level => 255 - level;
Darkroom.Apply([0, 100, 255], invert)        // [255, 155, 0]

Adjust lift = Darkroom.Brighter(60);
lift(100)                                    // 160
lift(230)                                    // 255: never above white
Darkroom.Brighter(-60)(30)                   // 0: never below black

Adjust both = Darkroom.Chain(lift, invert);  // lift first, then invert
both(100)                                    // 95

Func<string> next = Darkroom.Namer("IMG");
next()                                       // "IMG_001"
next()                                       // "IMG_002"
```
