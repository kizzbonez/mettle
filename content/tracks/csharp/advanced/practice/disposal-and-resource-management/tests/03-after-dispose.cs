var log = new List<string>();
var house = new Lamp("house", log);
var scene = new Scene(house, log);
scene.Spot("follow");
scene.Dispose();
log.Clear();

// Dispose a second and a third time.
try
{
    scene.Dispose();
    scene.Dispose();
}
catch (Exception e) when (e is not NotImplementedException)
{
    Check.True(false, "calling Dispose again does not throw");
}
Check.Equal(log.Count, 0, "calling Dispose again changes nothing");
Check.True(house.IsOn, "the house lights stay on, however often the scene is disposed");

// A disposed scene can switch on nothing.
Check.Throws<ObjectDisposedException>(() => scene.Spot("late"), "Spot on a disposed scene");
Check.Equal(log.Count, 0, "a disposed scene does not switch on a lamp before refusing");

// A scene that is disposed through using, then asked for another spot.
Scene? kept = null;
using (var brief = new Scene(house, log))
{
    kept = brief;
    brief.Spot("flash");
}
Check.Throws<ObjectDisposedException>(() => kept!.Spot("again"), "Spot after a using block has ended");

// The cue book refuses new cues once it is closed.
var saved = new List<List<string>>();
var book = new CueBook(cues => { saved.Add(cues.ToList()); return Task.CompletedTask; });
book.Add("house lights down");
await book.DisposeAsync();
Check.Throws<ObjectDisposedException>(() => book.Add("encore"), "Add on a closed cue book");
await book.DisposeAsync();
Check.Equal(saved.Count, 1, "a closed cue book is saved once, however often DisposeAsync is called");
Check.SequenceEqual(saved[0], ["house lights down"], "a cue refused after closing is not saved");
