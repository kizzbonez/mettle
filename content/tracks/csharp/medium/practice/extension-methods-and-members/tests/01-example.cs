// The example from the instructions.
Check.Equal("Lisbon".Code(), "LIS", "the code of Lisbon");
Check.Equal(" ely ".Code(), "ELY", "the code of ely with spaces around it");
Check.Equal(new TimeSpan(2, 5, 0).Clock, "2h05", "2 hours and 5 minutes on the clock");
Check.Equal(TimeSpan.Driving(150, 100), TimeSpan.FromMinutes(90), "the time to drive 150 km at 100 km/h");
Check.Equal(TimeSpan.Driving(100, 70).Clock, "1h26", "the time to drive 100 km at 70 km/h, on the clock");

Leg[] trip =
[
    new Leg("Lisbon", "Porto", 313, new TimeSpan(3, 5, 0)),
    new Leg("Porto", "Madrid", 561, new TimeSpan(5, 40, 0)),
];
Check.Equal(trip.TotalKm, 874.0, "the kilometres of the two legs");
Check.Equal(trip.Route(), "LIS > POR > MAD", "the route of the two legs");
Check.Equal(new List<Leg>().Route(), "", "the route of no legs");
