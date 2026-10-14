// Late fees are exact to the day, add up per member, and Describe formats them.
var library = new ToolLibrary(7, 0.25m);

library.Lend("A1", "M7", 10);
Check.True(library.Return("A1", 10) == 0m, "a tool returned on the day it was lent costs nothing");
library.Lend("A1", "M7", 10);
Check.True(library.Return("A1", 17) == 0m, "a tool kept exactly the loan period costs nothing");
library.Lend("A1", "M7", 10);
Check.True(library.Return("A1", 18) == 0.25m, "one day over the loan period costs one day's fee");
library.Lend("A1", "M7", 10);
Check.True(library.Return("A1", 20) == 0.75m, "three days over the loan period cost three days' fees");
Check.True(library.FeesOwedBy("m7") == 1.00m, "FeesOwedBy adds up every fee the member was charged");
Check.True(library.FeesOwedBy("M8") == 0m, "FeesOwedBy is zero for a member who was never charged");

Check.True(library.Describe(" m7 ") == "M7: 0 tools out, owes 1.00",
    "Describe uses the normalized id, the plural for zero tools and two decimals");
library.Lend("B2", "M7", 30);
Check.True(library.Describe("M7") == "M7: 1 tool out, owes 1.00", "Describe uses the singular for exactly one tool");
library.Lend("C3", "M7", 30);
Check.True(library.Describe("M7") == "M7: 2 tools out, owes 1.00", "Describe uses the plural for two tools");
Check.True(library.Describe("M8") == "M8: 0 tools out, owes 0.00", "Describe works for a member the library has never seen");

var daily = new ToolLibrary(1, 1.10m);
daily.Lend("D4", "M3", 5);
daily.Lend("E5", "M3", 5);
Check.True(daily.Return("D4", 9) == 3.30m, "the fee is the number of late days times the fee per day");
daily.Return("E5", 20);
Check.True(daily.FeesOwedBy("M3") == 18.70m, "fees from several returns add up for the member");
Check.True(daily.Describe("m3") == "M3: 0 tools out, owes 18.70", "Describe shows a total with two decimals");

var gift = new ToolLibrary(3, 0m);
gift.Lend("F6", "M4", 0);
Check.True(gift.Return("F6", 100) == 0m && gift.FeesOwedBy("M4") == 0m, "with a fee of zero nobody is charged");
