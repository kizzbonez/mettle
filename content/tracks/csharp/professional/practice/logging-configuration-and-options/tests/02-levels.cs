// Which levels a minimum lets through.
Level[] levels = [Level.Trace, Level.Debug, Level.Information, Level.Warning, Level.Error, Level.Critical, Level.None];
foreach (Level minimum in levels)
{
    var logger = new LineLogger("Snowmaking", minimum, new ListSink());
    foreach (Level level in levels)
    {
        bool expected = level != Level.None && level >= minimum;
        Check.Equal(logger.IsEnabled(level), expected, $"IsEnabled({level}) with the minimum {minimum}");
    }
}

// Enabled levels write one line each; the others write nothing.
var sink = new ListSink();
var log = new LineLogger("Snowmaking.Guns", Level.Warning, sink);
log.Log(Level.Trace, "Gun {Gun} sampled", 1);
log.Log(Level.Debug, "Gun {Gun} sampled", 2);
log.Log(Level.Information, "Gun {Gun} running", 3);
log.Log(Level.Warning, "Gun {Gun} iced up", 4);
log.Log(Level.Error, "Gun {Gun} failed", 5);
log.Log(Level.Critical, "Gun {Gun} on fire", 6);
log.Log(Level.None, "Gun {Gun} silent", 7);
Check.SequenceEqual(sink.Lines.Select(line => line.Split(' ')[0]), ["level=Warning", "level=Error", "level=Critical"],
    "the levels written by a logger whose minimum is Warning");

// A disabled call returns at once, before it looks at the template or the arguments.
var quiet = new ListSink();
var info = new LineLogger("Snowmaking", Level.Information, quiet);
bool threw = false;
try
{
    info.Log(Level.Debug, "Pumps {First} and {Second} primed", 1);
    info.Log(Level.Trace, "No placeholders here", 1, 2, 3);
}
catch (ArgumentException)
{
    threw = true;
}
Check.True(!threw, "a call below the minimum returns before it compares its template with its arguments");
Check.Equal(quiet.Lines.Count, 0, "lines written by calls below the minimum whose arguments do not match the template");

var off = new ListSink();
var none = new LineLogger("Snowmaking", Level.None, off);
none.Log(Level.Critical, "Compressor {Unit} stopped", 2);
Check.Equal(off.Lines.Count, 0, "lines written by a logger whose minimum is None, for a critical event");

// At the minimum itself.
var edge = new ListSink();
new LineLogger("Snowmaking", Level.Error, edge).Log(Level.Error, "Line {Line} frozen", 9);
Check.SequenceEqual(edge.Lines, ["level=Error category=Snowmaking template=\"Line {Line} frozen\" Line=9"],
    "the line for an event exactly at the minimum level");
