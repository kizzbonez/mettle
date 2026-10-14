// The example from the instructions.
var kitchen = new Kitchen();
kitchen.Order("soup");
kitchen.Order("risotto");
kitchen.Order("soup");
Check.Equal(kitchen.Waiting, 3, "the orders waiting after three were placed");
Check.Equal(kitchen.NextUp, "soup", "the order that has waited longest");
Check.Equal(kitchen.Cook(), "soup", "the first dish cooked");

IReadOnlyList<string> served = kitchen.Served;
Check.Equal(kitchen.Cook(), "risotto", "the second dish cooked");
Check.Equal(served.Count, 2, "the dishes in a view of Served taken before the second dish was cooked");
Check.Equal(served[1], "risotto", "the second dish in that view");
Check.Equal(kitchen.Waiting, 1, "the orders still waiting");

var tally = Menu.Tally(["Soup", "risotto", "soup", "Bread"]);
Check.Equal(string.Join(",", tally.Keys), "Bread,risotto,Soup", "the dishes in the tally, in order");
Check.Equal(tally["SOUP"], 2, "the count for soup, looked up in capitals");
