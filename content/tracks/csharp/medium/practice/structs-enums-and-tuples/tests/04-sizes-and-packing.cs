// SizeFor
Check.Equal<CakeSize?>(Bakery.SizeFor(16), CakeSize.Small, "the cake size with a diameter of 16");
Check.Equal<CakeSize?>(Bakery.SizeFor(20), CakeSize.Medium, "the cake size with a diameter of 20");
Check.Equal<CakeSize?>(Bakery.SizeFor(24), CakeSize.Large, "the cake size with a diameter of 24");
foreach (int centimetres in new[] { 0, 1, 2, 15, 17, 19, 22, 26, 100, -16 })
{
    Check.Equal<CakeSize?>(Bakery.SizeFor(centimetres), null, $"a diameter of {centimetres}, which no cake size has");
}

// Pack
Check.Equal(Bakery.Pack(12, 4), (3, 0), "an order that fills its boxes exactly");
Check.Equal(Bakery.Pack(3, 4), (0, 3), "fewer cakes than one box holds");
Check.Equal(Bakery.Pack(0, 6), (0, 0), "an order of no cakes");
Check.Equal(Bakery.Pack(7, 1), (7, 0), "boxes that hold one cake each");
Check.Equal(Bakery.Pack(5, 5), (1, 0), "exactly one box of cakes");
Check.Equal(Bakery.Pack(6, 5), (1, 1), "one cake more than one box holds");

var (full, left) = Bakery.Pack(50, 6);
Check.Equal(full, 8, "the full boxes for 50 cakes, 6 to a box");
Check.Equal(left, 2, "the cakes left over from 50, 6 to a box");

var packed = Bakery.Pack(9, 2);
Check.Equal(packed.Full, 4, "the tuple element named Full");
Check.Equal(packed.Left, 1, "the tuple element named Left");
