// int
Check.Equal(Shelter.Clamp(-3, 0, 10), 0, "a value below low gives low");
Check.Equal(Shelter.Clamp(5, 0, 10), 5, "a value between low and high is kept");
Check.Equal(Shelter.Clamp(0, 0, 10), 0, "a value equal to low is kept");
Check.Equal(Shelter.Clamp(10, 0, 10), 10, "a value equal to high is kept");
Check.Equal(Shelter.Clamp(11, 0, 10), 10, "a value just above high gives high");
Check.Equal(Shelter.Clamp(-1, 0, 0), 0, "low and high may be the same value");
Check.Equal(Shelter.Clamp(int.MaxValue, -5, 5), 5, "the largest int is kept down to high");
Check.Equal(Shelter.Clamp(int.MinValue, -5, 5), -5, "the smallest int is kept up to low");

// Other types that compare themselves.
Check.Equal(Shelter.Clamp(39.9, 37.5, 39.5), 39.5, "a double above high");
Check.Equal(Shelter.Clamp(36.1, 37.5, 39.5), 37.5, "a double below low");
Check.Equal(Shelter.Clamp(1.25m, 0.50m, 2.00m), 1.25m, "a decimal between low and high");
Check.Equal(Shelter.Clamp("apple", "bean", "pear"), "bean", "a string that sorts before low");
Check.Equal(Shelter.Clamp("kiwi", "bean", "pear"), "kiwi", "a string between low and high");
Check.Equal(Shelter.Clamp("plum", "bean", "pear"), "pear", "a string that sorts after high");

var open = new DateOnly(2026, 4, 1);
var close = new DateOnly(2026, 9, 30);
Check.Equal(Shelter.Clamp(new DateOnly(2026, 1, 15), open, close), open, "a date before the first day");
Check.Equal(Shelter.Clamp(new DateOnly(2026, 6, 15), open, close), new DateOnly(2026, 6, 15), "a date inside the season");
Check.Equal(Shelter.Clamp(new DateOnly(2027, 1, 1), open, close), close, "a date after the last day");

// The type argument can also be written out.
Check.Equal(Shelter.Clamp<long>(70, 1, 64), 64L, "an explicit type argument of long");
