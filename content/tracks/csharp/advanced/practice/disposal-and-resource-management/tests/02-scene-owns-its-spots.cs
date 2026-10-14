// Three spots, switched off newest first.
var log = new List<string>();
var house = new Lamp("house", log);
var scene = new Scene(house, log);
Lamp front = scene.Spot("front");
Lamp side = scene.Spot("side");
Lamp back = scene.Spot("back");
Check.True(front.IsOn && side.IsOn && back.IsOn, "the spots Spot returns are switched on");
Check.SequenceEqual(new[] { front.Name, side.Name, back.Name }, ["front", "side", "back"], "each spot has the name it was given");
Check.SequenceEqual(log, ["on house", "on front", "on side", "on back"], "Spot switches on one new lamp each time");
log.Clear();
scene.Dispose();
Check.SequenceEqual(log, ["off back", "off side", "off front"], "Dispose switches the spots off, newest first");
Check.True(!front.IsOn && !side.IsOn && !back.IsOn, "the lamps Spot returned are the ones the scene switched off");
Check.True(house.IsOn, "the scene never switches off the house lights it was handed");

// A spot that the operator switched off by hand during the scene.
log.Clear();
using (var second = new Scene(house, log))
{
    second.Spot("one");
    Lamp two = second.Spot("two");
    second.Spot("three");
    two.Dispose();
}
Check.SequenceEqual(
    log,
    ["on one", "on two", "on three", "off two", "off three", "off one"],
    "the scene switches off its other spots newest first, whatever the operator did by hand");

// Two scenes share the house lights: ending one leaves the other alone.
log.Clear();
var early = new Scene(house, log);
var late = new Scene(house, log);
Lamp earlyLamp = early.Spot("early");
Lamp lateLamp = late.Spot("late");
early.Dispose();
Check.True(!earlyLamp.IsOn, "the ended scene switched off its own spot");
Check.True(lateLamp.IsOn, "a scene switches off only the spots it created itself");
Check.True(house.IsOn, "ending a scene leaves the shared house lights on");
late.Dispose();

// A scene with no spots.
log.Clear();
using (new Scene(house, log)) { }
Check.Equal(log.Count, 0, "disposing a scene without spots switches nothing off");
