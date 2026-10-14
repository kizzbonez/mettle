// Covariance: a producer of apples is a producer of fruit, and of objects.
object appleStall = new Stall<Apple>(new Apple("russet"));
Check.True(appleStall is IStall<Fruit>, "a stall of apples can be used as a stall of fruit");
Check.True(appleStall is IStall<object>, "a stall of apples can be used as a stall of objects");
object pearStall = new Stall<Pear>(new Pear("comice"));
Check.True(pearStall is IStall<Fruit>, "a stall of pears can be used as a stall of fruit");

// Contravariance: a consumer of fruit is a consumer of apples and of pears.
object anyFruit = new Inspector<Fruit>(f => f.Name.Length > 3);
Check.True(anyFruit is IInspector<Apple>, "an inspector for any fruit can inspect apples");
Check.True(anyFruit is IInspector<Pear>, "an inspector for any fruit can inspect pears");
object anything = new Inspector<object>(o => true);
Check.True(anything is IInspector<Fruit>, "an inspector for any object can inspect fruit");

// Accepted keeps the stall's order.
var crates = new Stall<Fruit>(new Apple("jazz"), new Pear("conference"), new Apple("gala"), new Pear("comice"), new Apple("fuji"));
var longNames = new Inspector<Fruit>(f => f.Name.Length > 4);
Check.SequenceEqual(
    Market.Accepted(crates, longNames),
    [new Pear("conference"), new Pear("comice")],
    "the items that pass, in the order of the stall");
Check.SequenceEqual(
    Market.Accepted(crates, new Inspector<Fruit>(f => true)),
    [new Apple("jazz"), new Pear("conference"), new Apple("gala"), new Pear("comice"), new Apple("fuji")],
    "every item, when every item passes");
Check.Equal(Market.Accepted(crates, new Inspector<Fruit>(f => false)).Count, 0, "no item, when no item passes");
Check.Equal(Market.Accepted(new Stall<Apple>(), new Inspector<Apple>(a => true)).Count, 0, "no item from an empty stall");

// Accepted through the variant conversions.
if (appleStall is IStall<Fruit> asFruit && anyFruit is IInspector<Apple> forApples)
{
    Check.SequenceEqual(Market.Accepted(asFruit, (IInspector<Fruit>)anyFruit), [new Apple("russet")], "a stall of apples, inspected as fruit");
    Check.SequenceEqual(Market.Accepted((IStall<Apple>)appleStall, forApples), [new Apple("russet")], "apples, inspected by an inspector for any fruit");
}

// Accepted works for any T, value types included.
Check.SequenceEqual(
    Market.Accepted(new Stall<int>(4, 9, 16, 25), new Inspector<int>(n => n % 2 == 1)),
    [9, 25],
    "the odd numbers of a stall of ints");
