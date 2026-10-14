// The example from the instructions.
Check.Equal(Hub.Comfort(21.5), "comfortable", "the comfort of 21.5 degrees");
Check.Equal(Hub.Comfort(double.NaN), "no reading", "the comfort of NaN");

Check.Equal(Hub.Describe(new Thermometer("kitchen", 25)), "kitchen: warm", "a kitchen thermometer at 25 degrees");
Check.Equal(Hub.Describe(new Door("front", Open: false, Locked: true)), "front door is locked", "a closed, locked front door");
Check.Equal(Hub.Describe("milk is low"), "note: milk is low", "a typed note");
Check.Equal(Hub.Describe(null), "nothing", "a null message");
Check.Equal(Hub.Describe(42), "unknown message", "a message that is a number");

Check.Equal(Hub.Command(["lights", "off"]), "lights off", "the command lights off");
Check.Equal(Hub.Command(["heat", "21"]), "heating to 21", "the command heat 21");
Check.Equal(Hub.Command(["play", "jazz", "blues", "soul"]), "playing jazz and 2 more", "the command play with three names");
Check.Equal(Hub.Command(["heat", "hot"]), "unknown command: heat", "the command heat hot");
Check.Equal(Hub.Command([]), "say something", "no words at all");
