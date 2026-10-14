// Ids, the constructor, Lend and Return follow the rules in the instructions.
Check.True(ToolLibrary.NormalizeId("  drill-04 ") == "DRILL-04",
    "NormalizeId trims the id and converts it to upper case");
Check.Throws<ArgumentException>(() => ToolLibrary.NormalizeId(""), "NormalizeId rejects an empty id");
Check.Throws<ArgumentException>(() => ToolLibrary.NormalizeId("   "), "NormalizeId rejects an id made of spaces");

Check.Throws<ArgumentOutOfRangeException>(() => new ToolLibrary(0, 1m), "the constructor rejects a loan period below one day");
Check.Throws<ArgumentOutOfRangeException>(() => new ToolLibrary(7, -0.01m), "the constructor rejects a negative late fee");
var free = new ToolLibrary(1, 0m);
Check.True(free.LoanDays == 1 && free.LateFeePerDay == 0m && free.OnLoanCount == 0,
    "a one-day loan period and a fee of zero are allowed, and are reported by the properties");

var library = new ToolLibrary(7, 0.50m);
Check.Throws<ArgumentException>(() => library.Lend("DRILL-04", " ", 1), "Lend rejects a blank member id");
Check.Throws<ArgumentException>(() => library.Lend("", "M1", 1), "Lend rejects a blank tool id");
Check.Throws<ArgumentOutOfRangeException>(() => library.Lend("DRILL-04", "M1", -1), "Lend rejects a negative day");
Check.True(library.OnLoanCount == 0, "a rejected Lend changes nothing");

library.Lend("drill-04", "m1", 0);
Check.True(library.HolderOf("DRILL-04") == "M1", "Lend stores both ids in their normalized form, and day 0 is allowed");
Check.Throws<InvalidOperationException>(() => library.Lend(" Drill-04", "M2", 2),
    "Lend refuses a tool that is already on loan, even when the id is written differently");
Check.True(library.HolderOf("drill-04") == "M1", "a refused Lend leaves the earlier loan in place");

library.Lend("SAW-11", "M1", 1);
library.Lend("ladder-2", "M1", 1);
Check.Throws<InvalidOperationException>(() => library.Lend("SANDER-3", "m1", 2),
    "Lend refuses a fourth tool for the same member");
Check.True(library.HolderOf("SANDER-3") is null && library.OnLoanCount == 3, "a refused fourth loan is not recorded");
Check.True(string.Join(",", library.ToolsHeldBy(" m1")) == "DRILL-04,LADDER-2,SAW-11",
    "ToolsHeldBy lists a member's tools as normalized ids in ordinal order");
Check.True(library.ToolsHeldBy("M9").Count == 0, "ToolsHeldBy is an empty list for a member with no tools");

Check.Throws<InvalidOperationException>(() => library.Return("SANDER-3", 5), "Return refuses a tool that is not on loan");
Check.Throws<ArgumentOutOfRangeException>(() => library.Return("SAW-11", 0),
    "Return refuses a day before the day the tool was lent");
Check.True(library.HolderOf("SAW-11") == "M1", "a refused Return leaves the tool on loan");

library.Return("saw-11", 3);
Check.True(library.HolderOf("SAW-11") is null && library.OnLoanCount == 2, "Return takes the tool off loan");
library.Lend("SANDER-3", "M1", 3);
Check.True(library.HolderOf("sander-3") == "M1", "after a return the member may borrow a third tool again");
Check.Throws<InvalidOperationException>(() => library.Return("SAW-11", 4), "a tool cannot be returned twice");
