// The threshold: only readings below it water.
var bed = new SoilSensor("strawberries");
var sprinkler = new Sprinkler(dryBelow: 30);
sprinkler.Attach(bed);
bed.Report(30);
Check.Equal(sprinkler.Waterings, 0, "a reading equal to dryBelow does not water");
bed.Report(29);
bed.Report(0);
bed.Report(100);
Check.Equal(sprinkler.Waterings, 2, "every reading below dryBelow waters once");

// Detaching removes exactly the sprinkler's own handler.
var logged = new List<int>();
bed.MoistureRead += (sender, e) => logged.Add(e.Percent);
Check.Equal(bed.SubscriberCount, 2, "the subscribers with a sprinkler and a logger");
sprinkler.Detach();
Check.Equal(bed.SubscriberCount, 1, "Detach removes the sprinkler's handler from the sensor");
bed.Report(5);
Check.Equal(sprinkler.Waterings, 2, "a detached sprinkler no longer receives readings");
Check.SequenceEqual(logged, [5], "the other subscribers keep receiving readings after Detach");

// Detach when not attached, and Detach twice.
var spare = new Sprinkler(dryBelow: 50);
try
{
    spare.Detach();
    sprinkler.Detach();
}
catch (Exception e) when (e is not NotImplementedException)
{
    Check.True(false, "Detach does nothing when the sprinkler is not attached");
}
Check.Equal(bed.SubscriberCount, 1, "a second Detach removes nothing from the sensor");

// Two sprinklers on one bed: detaching one leaves the other in place.
var north = new Sprinkler(dryBelow: 40);
var south = new Sprinkler(dryBelow: 40);
north.Attach(bed);
south.Attach(bed);
bed.Report(10);
north.Detach();
north.Detach();
bed.Report(20);
Check.Equal(north.Waterings, 1, "the detached sprinkler watered only before it was detached");
Check.Equal(south.Waterings, 2, "the other sprinkler on the same sensor keeps watering");
Check.Equal(bed.SubscriberCount, 2, "Detach removes one sprinkler's handler and leaves the other's");

// A sprinkler that moves to another bed.
var herbs = new SoilSensor("herbs");
var mobile = new Sprinkler(dryBelow: 25);
mobile.Attach(bed);
bed.Report(10);
mobile.Detach();
mobile.Attach(herbs);
bed.Report(10);
herbs.Report(10);
herbs.Report(90);
Check.Equal(mobile.Waterings, 2, "after moving, the sprinkler waters for its new bed only");
Check.Equal(herbs.SubscriberCount, 1, "the new bed has the moved sprinkler as its subscriber");
mobile.Detach();
Check.Equal(herbs.SubscriberCount, 0, "Detach removes the sprinkler from the bed it is attached to now");
Check.Equal(bed.SubscriberCount, 2, "Detach leaves the old bed's subscribers alone");
