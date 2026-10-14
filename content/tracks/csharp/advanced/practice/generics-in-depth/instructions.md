The fruit records, `IScanned<TSelf>`, `Stall<T>` and `Inspector<T>` are complete in the starter.
Make the two interfaces variant and write the three methods of the static class `Market`.

1. **Variance.** A stall only hands items out, and an inspector only takes them in.
   - Make `IStall<T>` **covariant**, so that a stall of apples can be used as a stall of fruit.
   - Make `IInspector<T>` **contravariant**, so that an inspector for any fruit can be used as an
     inspector for apples.
2. `Accepted<T>(IStall<T> stall, IInspector<T> inspector)` returns `List<T>`: the items of the
   stall, from index 0 to `Count - 1`, that the inspector `Passes`, in that order.
3. `Spread<T>(IReadOnlyList<T> values) where T : INumber<T>` returns `T`: the largest value minus
   the smallest. For an empty list it is `T.Zero`.
4. `Scan<T>(IEnumerable<string> barcodes) where T : IScanned<T>` returns `List<T>`. For each
   barcode, in order, that starts with `T.Prefix` followed by a dash (exactly, upper case),
   add `T.FromCode(...)` of everything after that dash. Skip every other barcode.

Example:

```csharp
// 1. Variance.
IStall<Apple> apples = new Stall<Apple>(new Apple("gala"), new Apple("jazz"), new Apple("bramley"));
IStall<Fruit> fruit = apples;             // compiles once IStall<T> is covariant
IInspector<Fruit> firm = new Inspector<Fruit>(f => f.Name != "jazz");
IInspector<Apple> firmApples = firm;      // compiles once IInspector<T> is contravariant

// 2. Accepted.
Market.Accepted(apples, firmApples)       // [Apple { Name = gala }, Apple { Name = bramley }]
Market.Accepted(fruit, firm)              // the same two apples, in a List<Fruit>

// 3. Spread, for any number type.
Market.Spread([12, 7, 30, 18])            // 23
Market.Spread([2.5m, 1.25m])              // 1.25
Market.Spread(new List<double>())         // 0

// 4. Scan.
Market.Scan<Apple>(["APL-gala", "PEA-conference", "APL-jazz"])
                                          // [Apple { Name = gala }, Apple { Name = jazz }]
Market.Scan<Pear>(["APL-gala", "PEA-conference"])
                                          // [Pear { Name = conference }]
```

The tests check variance with `is`, as in `stall is IStall<Fruit>`, so that they compile before
you have added `out` and `in`.

**Tip:** `T.Zero`, `T.Prefix` and `T.FromCode(...)` are static members called through the type
parameter. `INumber<T>` lives in `System.Numerics`, which the starter already imports.
