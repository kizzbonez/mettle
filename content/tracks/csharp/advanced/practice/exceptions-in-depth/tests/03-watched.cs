// An action that succeeds.
var log = new List<string>();
int runs = 0;
Meters.Watched(() => runs++, log);
Check.Equal(runs, 1, "Watched runs the action once");
Check.Equal(log.Count, 0, "nothing is logged when the action succeeds");

// The same exception object reaches the caller.
var stuck = new InvalidOperationException("valve stuck");
Exception? caught = null;
try
{
    Meters.Watched(() => throw stuck, log);
}
catch (InvalidOperationException e)
{
    caught = e;
}
Check.True(ReferenceEquals(caught, stuck), "the caller of Watched receives the very exception the action threw");
Check.SequenceEqual(log, ["failed: valve stuck"], "the exception's message is logged");

// The filter runs before the finally blocks inside the action, innermost first.
log.Clear();
try
{
    Meters.Watched(() =>
    {
        try
        {
            try { throw new ArgumentException("bad meter id"); }
            finally { log.Add("inner cleanup"); }
        }
        finally
        {
            log.Add("outer cleanup");
        }
    }, log);
}
catch (ArgumentException) { }
Check.SequenceEqual(
    log,
    ["failed: bad meter id", "inner cleanup", "outer cleanup"],
    "the log line is written by a filter, before the stack is unwound");

// A catch further up that filters on the type still sees the original type.
log.Clear();
string handledBy = "";
try
{
    try
    {
        Meters.Watched(() => throw new IOException("van offline"), log);
    }
    catch (InvalidOperationException)
    {
        handledBy = "the wrong handler";
    }
}
catch (IOException e) when (e.Message == "van offline")
{
    handledBy = "the IOException handler";
}
Check.Equal(handledBy, "the IOException handler", "the handler that receives an IOException passing through Watched");
Check.SequenceEqual(log, ["failed: van offline"], "an IOException is logged too");
