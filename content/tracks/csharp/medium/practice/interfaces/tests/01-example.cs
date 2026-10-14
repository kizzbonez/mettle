// The example from the instructions.
var ada = new Runner("Ada", 2465);
var bo = new Runner("Bo", 2401);
var club = new Relay("Harbour Club", [600, 615, 590, 640]);

ITimed entry = ada;
Check.Equal(entry.Result(), "Ada 41:05", "the result line of a runner, through an ITimed variable");
Check.Equal(club.Seconds, 2445, "the time of a relay team of four legs");
Check.Equal(((ITimed)club).Result(), "Harbour Club 40:45", "the result line of that relay team");

var runners = new List<Runner> { ada, bo, new Runner("Cy", 2401) };
runners.Sort();
Check.Equal($"{runners[0].Name} {runners[1].Name} {runners[2].Name}", "Bo Cy Ada", "the names of the runners after Sort");
Check.True(runners.Contains(new Runner("Ada", 2465)), "Contains for a new runner object with Ada's name and time");

ITimed winner = Results.Winner([ada, club, bo]);
Check.True(ReferenceEquals(winner, bo), "the winner of Ada, the relay team and Bo");
