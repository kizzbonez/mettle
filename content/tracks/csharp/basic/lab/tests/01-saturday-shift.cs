// The Saturday shift from the instructions, replayed line by line.
var library = new ToolLibrary(7, 0.50m);
string log =
    "# Saturday desk, volunteer: Priya\n" +
    "1 OUT drill-04 m1032\n" +
    "1 OUT SAW-11 M1032\n" +
    "2 OUT LADDER-2 M2001\n" +
    "3 OUT DRILL-04 M2001\n" +
    "\n" +
    "9 IN DRILL-04\n" +
    "10 BORROW SAW-11 M1032\n" +
    "12 IN ladder-2\n";

List<int> rejected = DeskLog.Replay(library, log);

Check.SequenceEqual(rejected, new[] { 5, 8 },
    "Replay returns the numbers of the lines it could not apply, counting comment and blank lines");
Check.Equal(library.OnLoanCount, 1, "OnLoanCount after the shift");
Check.Equal(library.HolderOf("saw-11"), "M1032", "HolderOf finds the member who has SAW-11, whatever the case of the id");
Check.Equal(library.HolderOf("DRILL-04"), null, "HolderOf is null for a tool that came back");
Check.Equal(library.FeesOwedBy("M1032"), 0.50m, "FeesOwedBy for the member who kept DRILL-04 one day too long");
Check.Equal(library.Describe("m2001"), "M2001: 0 tools out, owes 1.50", "Describe for the member who returned LADDER-2 late");
Check.Equal(library.Describe("M1032"), "M1032: 1 tool out, owes 0.50", "Describe for the member who still has SAW-11");
