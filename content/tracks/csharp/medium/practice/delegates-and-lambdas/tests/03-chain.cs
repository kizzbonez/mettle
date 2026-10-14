Adjust invert = level => 255 - level;
Adjust lift = Darkroom.Brighter(100);
Adjust half = level => level / 2;

Check.Equal(Darkroom.Chain()(42), 42, "a chain with no steps returns the level unchanged");
Check.Equal(Darkroom.Chain(invert)(55), 200, "a chain of one step");

// The order of the steps matters.
Check.Equal(Darkroom.Chain(lift, invert)(200), 0, "lift first, then invert");
Check.Equal(Darkroom.Chain(invert, lift)(200), 155, "invert first, then lift");
Check.Equal(Darkroom.Chain(half, lift, invert)(100), 105, "three steps, run in the order given");
Check.Equal(Darkroom.Chain(lift, lift, lift)(0), 255, "the same step three times, each on the result of the one before");

// Each step gets the result of the one before.
var log = new List<string>();
Adjust first = level => { log.Add($"first {level}"); return level + 1; };
Adjust second = level => { log.Add($"second {level}"); return level * 10; };
Adjust both = Darkroom.Chain(first, second);
Check.Equal(both(4), 50, "a chain of two logging steps");
Check.SequenceEqual(log, new[] { "first 4", "second 5" }, "each step runs once and gets the result of the step before");

// Building the chain runs nothing.
log.Clear();
Darkroom.Chain(first, second);
Check.Equal(log.Count, 0, "making a chain does not run its steps");

// A chain is an Adjust like any other.
Check.SequenceEqual(Darkroom.Apply([0, 10], Darkroom.Chain(invert, half)), new[] { 127, 122 }, "a chain passed to Apply");
Adjust nested = Darkroom.Chain(Darkroom.Chain(lift, half), invert);
Check.Equal(nested(10), 200, "a chain used as a step of another chain");
