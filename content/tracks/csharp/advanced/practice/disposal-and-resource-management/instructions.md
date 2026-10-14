`Lamp` is complete in the starter: creating one switches it on (and writes `on {name}` to the
log), and disposing it switches it off (`off {name}`), once. Write the four marked bodies of
`Scene` and `CueBook`. You may add private fields.

1. `Scene.Spot(string name)` switches on a new spotlight, `new Lamp(name, log)`, keeps it, and
   returns it. The scene **owns** every spot it created. After the scene has been disposed,
   `Spot` throws `ObjectDisposedException` and switches nothing on.
2. `Scene.Dispose()` disposes every spot the scene created, **newest first**. It never disposes
   `HouseLights`: the scene was handed them and does not own them. A second call does nothing.
3. `CueBook.Add(string cue)` keeps the cue. After `DisposeAsync` has been called, it throws
   `ObjectDisposedException`.
4. `CueBook.DisposeAsync()` saves the book: it calls `save` with every cue in the order they were
   added (an empty list if there are none) and **awaits** the task that `save` returns. Only the
   first call saves. Any later call does nothing, even one made before the first has finished.

Example:

```csharp
var log = new List<string>();
var house = new Lamp("house lights", log);
using (var scene = new Scene(house, log))
{
    scene.Spot("left");
    scene.Spot("right");
}
log            // ["on house lights", "on left", "on right", "off right", "off left"]
house.IsOn     // true: the scene does not own the house lights

var saved = new List<string>();
await using (var book = new CueBook(cues => { saved.AddRange(cues); return Task.CompletedTask; }))
{
    book.Add("lights up");
    book.Add("music");
}
saved          // ["lights up", "music"]
```

**Tip:** `ObjectDisposedException.ThrowIf(disposed, this)` does the check in one line. Write
`DisposeAsync` as `public async ValueTask DisposeAsync()`, and decide whether it has already run
before its first `await`.
