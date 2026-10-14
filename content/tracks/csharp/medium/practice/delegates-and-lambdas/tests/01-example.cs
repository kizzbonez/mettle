// The example from the instructions.
Adjust invert = level => 255 - level;
Check.SequenceEqual(Darkroom.Apply([0, 100, 255], invert), new[] { 255, 155, 0 }, "0, 100 and 255 inverted");

Adjust lift = Darkroom.Brighter(60);
Check.Equal(lift(100), 160, "100 made brighter by 60");
Check.Equal(lift(230), 255, "230 made brighter by 60");
Check.Equal(Darkroom.Brighter(-60)(30), 0, "30 made darker by 60");

Adjust both = Darkroom.Chain(lift, invert);
Check.Equal(both(100), 95, "100 made brighter by 60 and then inverted");

Func<string> next = Darkroom.Namer("IMG");
Check.Equal(next(), "IMG_001", "the first name from a namer");
Check.Equal(next(), "IMG_002", "the second name from the same namer");
