var log = new List<string>();
var house = new Lamp("house lights", log);
using (var scene = new Scene(house, log))
{
    scene.Spot("left");
    scene.Spot("right");
}
Check.SequenceEqual(
    log,
    ["on house lights", "on left", "on right", "off right", "off left"],
    "the log of a scene with two spots, from start to end");
Check.True(house.IsOn, "the house lights after the scene has ended");

var saved = new List<string>();
await using (var book = new CueBook(cues => { saved.AddRange(cues); return Task.CompletedTask; }))
{
    book.Add("lights up");
    book.Add("music");
}
Check.SequenceEqual(saved, ["lights up", "music"], "the cues saved when the book was closed");
