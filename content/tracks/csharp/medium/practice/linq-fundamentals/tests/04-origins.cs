List<Stall> stalls =
[
    new Stall("Orchard Lane", "Kelby"),
    new Stall("Fen Gardens", "Marsh End"),
    new Stall("Bee Hut", "Ashby"),
];

List<Sale> day =
[
    new Sale("Bee Hut", "honey", 1, 6m),
    new Sale("Unknown Van", "crepes", 2, 3m),
    new Sale("Orchard Lane", "cherries", 1, 4m),
    new Sale("Fen Gardens", "celery", 2, 1m),
    new Sale("Bee Hut", "wax", 3, 2m),
    new Sale("Gone Stall", "eggs", 6, 0.3m),
];

Check.SequenceEqual(
    Market.Origins(day, stalls),
    new[] { "honey from Ashby", "cherries from Kelby", "celery from Marsh End", "wax from Ashby" },
    "each sale paired with its stall's village, in the order of the sales, unknown stalls left out");

Check.SequenceEqual(Market.Origins(day, new List<Stall>()), new string[0], "with no stall records every sale is left out");
Check.SequenceEqual(Market.Origins(new List<Sale>(), stalls), new string[0], "with no sales there is nothing to pair");

// A stall with no sales adds nothing; a stall with many sales appears for each.
List<Sale> busy =
[
    new Sale("Fen Gardens", "peas", 1, 1m),
    new Sale("Fen Gardens", "beans", 1, 1m),
    new Sale("Fen Gardens", "peas", 1, 1m),
];
Check.SequenceEqual(
    Market.Origins(busy, stalls),
    new[] { "peas from Marsh End", "beans from Marsh End", "peas from Marsh End" },
    "every sale of one stall is listed, repeats included");

// Names must match exactly.
Check.SequenceEqual(
    Market.Origins([new Sale("bee hut", "honey", 1, 6m)], stalls),
    new string[0],
    "a stall name in another case does not match");

// The order of the stall records does not matter.
var reversed = new List<Stall>(stalls);
reversed.Reverse();
Check.SequenceEqual(Market.Origins(day, reversed), Market.Origins(day, stalls), "the result follows the sales, whatever the order of the stalls");
