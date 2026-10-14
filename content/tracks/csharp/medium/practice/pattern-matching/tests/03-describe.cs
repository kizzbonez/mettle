// Thermometers use Comfort.
Check.Equal(Hub.Describe(new Thermometer("cellar", 9.5)), "cellar: cold", "a cold cellar");
Check.Equal(Hub.Describe(new Thermometer("living room", 16)), "living room: comfortable", "a room name of two words at 16 degrees");
Check.Equal(Hub.Describe(new Thermometer("attic", 24)), "attic: warm", "an attic at exactly 24 degrees");
Check.Equal(Hub.Describe(new Thermometer("garden", double.NaN)), "garden: no reading", "a thermometer that sent NaN");

// Doors.
Check.Equal(Hub.Describe(new Door("back", Open: true, Locked: false)), "back door is open", "an open door");
Check.Equal(Hub.Describe(new Door("back", Open: true, Locked: true)), "back door is open", "an open door is open whatever Locked says");
Check.Equal(Hub.Describe(new Door("garage", Open: false, Locked: true)), "garage door is locked", "a closed, locked door");
Check.Equal(Hub.Describe(new Door("garage", Open: false, Locked: false)), "garage door is closed", "a closed door that is not locked");

// Notes.
Check.Equal(Hub.Describe(""), "empty note", "an empty note");
Check.Equal(Hub.Describe(" "), "note:  ", "a note of one space is not empty");
Check.Equal(Hub.Describe("call the plumber"), "note: call the plumber", "a note of several words");

// Anything else.
Check.Equal(Hub.Describe(3.5), "unknown message", "a message that is a double");
Check.Equal(Hub.Describe(true), "unknown message", "a message that is a bool");
Check.Equal(Hub.Describe(new List<string> { "a note" }), "unknown message", "a list of strings is not a string");
Check.Equal(Hub.Describe(new object()), "unknown message", "a plain object");
object? nothing = null;
Check.Equal(Hub.Describe(nothing), "nothing", "a null held in an object variable");
