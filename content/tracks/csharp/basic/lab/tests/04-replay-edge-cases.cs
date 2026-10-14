// Replay skips what it should, rejects what it cannot read or apply, and never throws.
var empty = new ToolLibrary(7, 1m);
Check.True(DeskLog.Replay(empty, "").Count == 0, "an empty log rejects nothing");
Check.True(DeskLog.Replay(empty, "# closed today\n\n   \n  # 1 OUT A1 M1\n").Count == 0 && empty.OnLoanCount == 0,
    "comment lines, including indented ones that look like entries, and blank lines are skipped");

var library = new ToolLibrary(7, 1m);
string windowsLog = "1 OUT A1 M1\r\n2 OUT B2 M2\r\n\r\n4 IN A1\r\n";
Check.True(DeskLog.Replay(library, windowsLog).Count == 0, "lines that end with \\r\\n are read like lines that end with \\n");
Check.True(library.HolderOf("A1") is null && library.HolderOf("B2") == "M2", "every line of a \\r\\n log is applied");

var unreadable = new ToolLibrary(7, 1m);
string badLines =
    "-1 OUT A1 M1\n" +
    "two OUT A1 M1\n" +
    "3.5 OUT A1 M1\n" +
    "4 out A1 M1\n" +
    "4 OUT A1\n" +
    "4 IN A1 M1\n" +
    "4\n" +
    "4 IN\n" +
    "4 LEND A1 M1\n";
List<int> rejected = DeskLog.Replay(unreadable, badLines);
Check.True(rejected.Count == 9, "a bad day, a lower-case or unknown action and a wrong number of fields each reject the line");
Check.True(unreadable.OnLoanCount == 0, "a rejected line changes nothing");

var spaced = new ToolLibrary(7, 1m);
Check.True(DeskLog.Replay(spaced, "  5   OUT   a1    m1  \n").Count == 0 && spaced.HolderOf("A1") == "M1",
    "fields may be separated by several spaces and surrounded by spaces");

var busy = new ToolLibrary(2, 0.50m);
string busyLog =
    "1 OUT A1 M1\n" +
    "1 OUT A2 M1\n" +
    "# M1 reaches the limit of three tools on the next line\n" +
    "1 OUT A3 M1\n" +
    "2 OUT A4 m1\n" +
    "2 IN Z9\n" +
    "0 IN A1\n" +
    "6 IN A1\n" +
    "7 OUT A4 M1\n" +
    "8 OUT A1 M2\n";
List<int> refused = DeskLog.Replay(busy, busyLog);
Check.True(string.Join(",", refused) == "5,6,7",
    "lines the library refuses are rejected, and the lines after them are still applied");
Check.True(busy.HolderOf("A4") == "M1" && busy.HolderOf("A1") == "M2" && busy.FeesOwedBy("M1") == 1.50m,
    "the state after a log with refused lines matches applying only the accepted lines");

var noisy = new ToolLibrary(7, 1m);
string garbage = "\u0000\n,,,,\nOUT OUT OUT OUT\n99999999999 OUT A1 M1\n1 IN\t\n1 OUT \t A1 M1\n#\n";
bool threw = false;
try
{
    DeskLog.Replay(noisy, garbage);
}
catch (Exception)
{
    threw = true;
}
Check.True(!threw, "Replay never throws, whatever the log contains");
