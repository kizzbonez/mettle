// The default Result method, for runners.
static string ResultOf(ITimed entry) => entry.Result();

Check.Equal(ResultOf(new Runner("Dee", 0)), "Dee 0:00", "the result line for 0 seconds");
Check.Equal(ResultOf(new Runner("Dee", 7)), "Dee 0:07", "the seconds always have two digits");
Check.Equal(ResultOf(new Runner("Dee", 59)), "Dee 0:59", "the result line for 59 seconds");
Check.Equal(ResultOf(new Runner("Dee", 60)), "Dee 1:00", "the result line for exactly one minute");
Check.Equal(ResultOf(new Runner("Dee", 610)), "Dee 10:10", "the result line for 610 seconds");
Check.Equal(ResultOf(new Runner("Dee", 3725)), "Dee 62:05", "minutes are not split into hours");
Check.Equal(ResultOf(new Runner("Eli Moss", 1800)), "Eli Moss 30:00", "a name of two words is shown whole");

// Relays.
var solo = new Relay("Lone Wolves", [1234]);
Check.Equal(solo.Seconds, 1234, "a relay of one leg takes as long as that leg");
Check.Equal(solo.Name, "Lone Wolves", "a relay's name is its team");
Check.Equal(new Relay("Ghosts", []).Seconds, 0, "a relay with no legs has 0 seconds");
Check.Equal(new Relay("Pairs", [300, 301]).Seconds, 601, "the legs of a relay add up");
Check.Equal(ResultOf(new Relay("Pairs", [300, 301])), "Pairs 10:01", "the result line of a relay comes from the same default method");
Check.Equal(ResultOf(new Relay("Ghosts", [])), "Ghosts 0:00", "the result line of a relay with no legs");

// Seconds is worked out from the legs each time, so a copy agrees.
var copy = solo;
Check.Equal(copy.Seconds, solo.Seconds, "a copy of a relay has the same time");

// An ITimed variable holds either kind.
ITimed[] board = [new Runner("Fay", 95), new Relay("Quick Four", [20, 25, 30, 25])];
Check.Equal(board[0].Result() + " | " + board[1].Result(), "Fay 1:35 | Quick Four 1:40", "a board of a runner and a relay");
