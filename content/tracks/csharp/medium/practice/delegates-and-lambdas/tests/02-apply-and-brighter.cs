// Apply calls the adjustment once for every level, in order.
int[] picture = [10, 20, 30, 40];
var seen = new List<int>();
int[] doubled = Darkroom.Apply(picture, level =>
{
    seen.Add(level);
    return level * 2;
});
Check.SequenceEqual(doubled, new[] { 20, 40, 60, 80 }, "every level passed through the adjustment");
Check.SequenceEqual(seen, new[] { 10, 20, 30, 40 }, "the adjustment is called once for every level, in order");
Check.SequenceEqual(picture, new[] { 10, 20, 30, 40 }, "the array given to Apply stays as it was");
Check.True(!ReferenceEquals(doubled, picture), "Apply returns a new array");
Check.Equal(Darkroom.Apply([], level => level + 1).Length, 0, "an empty picture gives an empty array");

// A method converts to Adjust as well as a lambda does.
static int Half(int level) => level / 2;
Check.SequenceEqual(Darkroom.Apply([255, 9], Half), new[] { 127, 4 }, "a named method passed as the adjustment");

// Brighter
Adjust plus = Darkroom.Brighter(25);
Check.Equal(plus(0), 25, "black made brighter by 25");
Check.Equal(plus(230), 255, "a result of exactly 255 is kept");
Check.Equal(plus(240), 255, "a result above 255 is cut to 255");
Check.Equal(plus(255), 255, "white stays white");
Adjust minus = Darkroom.Brighter(-25);
Check.Equal(minus(25), 0, "a result of exactly 0 is kept");
Check.Equal(minus(10), 0, "a result below 0 is raised to 0");
Check.Equal(minus(200), 175, "200 made darker by 25");
Check.Equal(Darkroom.Brighter(0)(77), 77, "an amount of 0 changes nothing");
Check.Equal(Darkroom.Brighter(1000)(1), 255, "a huge amount gives white");
Check.Equal(Darkroom.Brighter(-1000)(254), 0, "a huge negative amount gives black");

// Each adjustment keeps its own amount.
Adjust small = Darkroom.Brighter(5);
Adjust large = Darkroom.Brighter(50);
Check.Equal(small(100) + large(100), 255, "two adjustments made by Brighter keep their own amounts");
Check.SequenceEqual(Darkroom.Apply([0, 128, 250], large), new[] { 50, 178, 255 }, "Brighter's result passed to Apply");
