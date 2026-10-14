// Ints, in any order.
Check.Equal(Market.Spread([5, 1, 9, 3]), 8, "the spread of four ints");
Check.Equal(Market.Spread([9, 5, 1]), 8, "the spread when the largest comes first");
Check.Equal(Market.Spread([1, 5, 9]), 8, "the spread when the smallest comes first");

// Negative values: the largest can be below zero.
Check.Equal(Market.Spread([-3, -9, -4]), 6, "the spread of values that are all negative");
Check.Equal(Market.Spread([-5, 2]), 7, "the spread of a negative and a positive value");
Check.Equal(Market.Spread([12, 40, 31]), 28, "the spread of values that are all positive");

// One value, equal values, and no values.
Check.Equal(Market.Spread([42]), 0, "the spread of a single value");
Check.Equal(Market.Spread([7, 7, 7]), 0, "the spread of equal values");
int noInts = -1;
try
{
    noInts = Market.Spread(new List<int>());
}
catch (InvalidOperationException)
{
    Check.True(false, "the spread of an empty list is a value, not an error");
}
Check.Equal(noInts, 0, "the spread of no ints");
Check.Equal(Market.Spread(Array.Empty<decimal>()), 0m, "the spread of no decimals");

// Other number types follow their own rules.
Check.Equal(Market.Spread([0.75, 2.5, 1.0]), 1.75, "the spread of doubles");
Check.Equal(Market.Spread([19.99m, 4.50m, 7.25m]), 15.49m, "the spread of decimals");
Check.Equal(Market.Spread([3_000_000_000L, -1_000_000_000L]), 4_000_000_000L, "the spread of longs beyond the range of int");
Check.Equal(Market.Spread(new byte[] { 200, 10, 90 }), (byte)190, "the spread of bytes");
Check.Equal(Market.Spread([-2.5f, -0.5f]), 2.0f, "the spread of negative floats");
