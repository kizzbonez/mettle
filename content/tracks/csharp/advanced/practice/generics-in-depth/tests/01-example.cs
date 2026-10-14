// 1. Variance, checked with `is` so that this file compiles before you add `out` and `in`.
IStall<Apple> apples = new Stall<Apple>(new Apple("gala"), new Apple("jazz"), new Apple("bramley"));
IInspector<Fruit> firm = new Inspector<Fruit>(f => f.Name != "jazz");
Check.True(apples is IStall<Fruit>, "a stall of apples can be used as a stall of fruit");
Check.True(firm is IInspector<Apple>, "an inspector for any fruit can be used as an inspector for apples");

// 2. Accepted.
var firmApples = (IInspector<Apple>)firm;
Check.SequenceEqual(
    Market.Accepted(apples, firmApples),
    [new Apple("gala"), new Apple("bramley")],
    "the apples that the inspector passes");
var fruit = (IStall<Fruit>)apples;
List<Fruit> passed = Market.Accepted(fruit, firm);
Check.SequenceEqual(passed, [new Apple("gala"), new Apple("bramley")], "the same apples, seen as fruit");

// 3. Spread, for any number type.
Check.Equal(Market.Spread([12, 7, 30, 18]), 23, "the spread of four ints");
Check.Equal(Market.Spread([2.5m, 1.25m]), 1.25m, "the spread of two decimals");
double noDoubles = -1;
try
{
    noDoubles = Market.Spread(new List<double>());
}
catch (InvalidOperationException)
{
    Check.True(false, "the spread of an empty list is a value, not an error");
}
Check.Equal(noDoubles, 0.0, "the spread of no doubles");

// 4. Scan.
Check.SequenceEqual(
    Market.Scan<Apple>(["APL-gala", "PEA-conference", "APL-jazz"]),
    [new Apple("gala"), new Apple("jazz")],
    "the apples among three barcodes");
Check.SequenceEqual(
    Market.Scan<Pear>(["APL-gala", "PEA-conference"]),
    [new Pear("conference")],
    "the pears among two barcodes");
