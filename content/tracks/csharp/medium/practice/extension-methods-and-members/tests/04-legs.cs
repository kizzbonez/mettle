var oneLeg = new List<Leg> { new Leg("Faro", "Seville", 200, TimeSpan.FromHours(2)) };
Check.Equal(oneLeg.TotalKm, 200.0, "the kilometres of one leg");
Check.Equal(oneLeg.Route(), "FAR > SEV", "the route of one leg names its start and its end");

Leg[] tour =
[
    new Leg("granada", "Cordoba", 205.5, TimeSpan.FromHours(2)),
    new Leg("Cordoba", " Toledo", 320, TimeSpan.FromHours(3)),
    new Leg(" Toledo", "Madrid", 72.5, TimeSpan.FromHours(1)),
    new Leg("Madrid", "Ur", 10, TimeSpan.FromMinutes(10)),
];
Check.Equal(tour.TotalKm, 608.0, "the kilometres of four legs, with halves");
Check.Equal(tour.Route(), "GRA > COR > TOL > MAD > UR", "the route of four legs, every place written with Code");

// The members work on any sequence of legs.
Check.Equal(new Leg[0].TotalKm, 0.0, "no legs cover 0 km");
Check.Equal(new Leg[0].Route(), "", "no legs give an empty route");
IEnumerable<Leg> firstTwo = tour.Take(2);
Check.Equal(firstTwo.TotalKm, 525.5, "the kilometres of a sequence that is not a list or an array");
Check.Equal(firstTwo.Route(), "GRA > COR > TOL", "the route of a sequence that is not a list or an array");
var queue = new Queue<Leg>(tour);
Check.Equal(queue.Route(), "GRA > COR > TOL > MAD > UR", "the route of a queue of legs");

// Asking twice gives the same answer.
Check.Equal(tour.Route(), tour.Route(), "the route of the same legs, asked twice");
