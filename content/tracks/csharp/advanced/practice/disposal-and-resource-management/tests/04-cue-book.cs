async Task Settle(Task task, string what)
{
    if (await Task.WhenAny(task, Task.Delay(3000)) != task) Check.True(false, what);
}

// A network drive that finishes saving only when this test says so.
var saves = new List<List<string>>();
var drive = new TaskCompletionSource();
Task Save(IReadOnlyList<string> cues)
{
    saves.Add(cues.ToList());
    return drive.Task;
}

var book = new CueBook(Save);
book.Add("doors open");
book.Add("lights down");
book.Add("curtain");
Check.Equal(saves.Count, 0, "nothing is saved before the book is closed");

ValueTask closing = book.DisposeAsync();
Check.Equal(saves.Count, 1, "DisposeAsync calls save");
Check.SequenceEqual(saves[0], ["doors open", "lights down", "curtain"], "the cues are saved in the order they were added");
Check.True(!closing.IsCompleted, "DisposeAsync awaits the save and is not finished while it runs");

// While the save is still running.
Check.Throws<ObjectDisposedException>(() => book.Add("bows"), "Add while the book is being saved");
ValueTask again = book.DisposeAsync();

drive.SetResult();
await Settle(closing.AsTask(), "DisposeAsync finishes once the save has finished");
await Settle(again.AsTask(), "a second DisposeAsync finishes too");
Check.Equal(saves.Count, 1, "a second DisposeAsync, made before the first had finished, does not save again");
await book.DisposeAsync();
Check.Equal(saves.Count, 1, "a later DisposeAsync does not save again");

// An empty book is still saved, as an empty list.
var empty = new List<IReadOnlyList<string>>();
await using (var nothing = new CueBook(cues => { empty.Add(cues.ToList()); return Task.CompletedTask; })) { }
Check.Equal(empty.Count, 1, "an empty book is saved once when it is closed");
Check.Equal(empty[0].Count, 0, "an empty book saves an empty list");

// await using closes the book even when the show is interrupted.
var interrupted = new List<string>();
try
{
    await using var show = new CueBook(cues => { interrupted.AddRange(cues); return Task.CompletedTask; });
    show.Add("act one");
    throw new InvalidOperationException("fire alarm");
}
catch (InvalidOperationException)
{
    Check.SequenceEqual(interrupted, ["act one"], "the cues are saved before the catch block runs");
}
