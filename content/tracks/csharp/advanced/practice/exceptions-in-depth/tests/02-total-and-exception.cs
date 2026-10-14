// The three standard constructors. They are looked up by reflection, so that
// this test compiles before you have written them.
var none = typeof(ReadingException).GetConstructor(Type.EmptyTypes);
var withMessage = typeof(ReadingException).GetConstructor([typeof(string)]);
var withInner = typeof(ReadingException).GetConstructor([typeof(string), typeof(Exception)]);
Check.True(none is not null && none.IsPublic, "ReadingException has a public constructor with no parameters");
Check.True(withMessage is not null && withMessage.IsPublic, "ReadingException has a public constructor that takes a message");
Check.True(withInner is not null && withInner.IsPublic, "ReadingException has a public constructor that takes a message and an inner exception");

var plain = (ReadingException)withMessage!.Invoke(["meter M-7 unreadable"]);
Check.Equal(plain.Message, "meter M-7 unreadable", "the message given to the constructor reaches Exception.Message");
var cause = new FormatException("not a number");
var wrapped = (ReadingException)withInner!.Invoke(["line 4 is bad", cause]);
Check.Equal(wrapped.Message, "line 4 is bad", "the message given with an inner exception reaches Exception.Message");
Check.True(ReferenceEquals(wrapped.InnerException, cause), "the inner exception given to the constructor becomes InnerException");

// Totals.
Check.Equal(Meters.Total([]), 0, "the total of no lines");
Check.Equal(Meters.Total(["M-1:7"]), 7, "the total of one line");
Check.Equal(Meters.Total(["M-1:1000", "M-22:-40", "M-333:5"]), 965, "the total of three lines, one of them negative");

// A bad line in the middle: the number counts from 1.
try
{
    Meters.Total(["M-1:10", "M-2:20", "M-3:2O", "M-4:40"]);
    Check.True(false, "Total throws ReadingException for a reading that is not a number");
}
catch (ReadingException e)
{
    Check.Equal(e.Line, 3, "the Line of a bad third line");
    Check.True(e.InnerException is FormatException, "the FormatException is kept as the inner exception");
}

// A bad first line, and an empty number.
try
{
    Meters.Total(["M-9:", "M-10:5"]);
    Check.True(false, "Total throws ReadingException for a line with nothing after the colon");
}
catch (ReadingException e)
{
    Check.Equal(e.Line, 1, "the Line of a bad first line");
    Check.True(e.InnerException is FormatException, "the FormatException of an empty number is kept as the inner exception");
}
