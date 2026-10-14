var only = new Runner("Lou", 2000);
Check.True(ReferenceEquals(Results.Winner([only]), only), "the winner of a race with one entry");

// A relay can win.
var relay = new Relay("Night Owls", [400, 410, 395]);   // 1205 seconds
var runner = new Runner("Mo", 1300);
ITimed first = Results.Winner([runner, relay]);
Check.Equal(first.Name, "Night Owls", "a relay that is faster than every runner wins");
Check.Equal(first.Seconds, 1205, "the winning relay keeps its time");

// The fastest entry wins wherever it stands.
var a = new Runner("Ana", 1900);
var b = new Runner("Ben", 1850);
var c = new Runner("Cas", 1999);
Check.True(ReferenceEquals(Results.Winner([b, a, c]), b), "the fastest entry first in the list");
Check.True(ReferenceEquals(Results.Winner([a, c, b]), b), "the fastest entry last in the list");
Check.True(ReferenceEquals(Results.Winner([a, b, c]), b), "the fastest entry in the middle of the list");

// Ties go to the entry that comes first.
var early = new Runner("Zed", 1850);
var late = new Runner("Abe", 1850);
Check.True(ReferenceEquals(Results.Winner([a, early, late]), early), "on a tie the entry first in the list wins, not the first name");
Check.True(ReferenceEquals(Results.Winner([late, early]), late), "on a tie the entry first in the list wins, in the other order");
Check.Equal(Results.Winner([new Relay("Tied Team", [925, 925]), early]).Name, "Tied Team", "a relay and a runner with equal times");
Check.True(ReferenceEquals(Results.Winner([early, new Relay("Tied Team", [925, 925])]), early), "a runner and a relay with equal times");
