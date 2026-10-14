// Clock
Check.Equal(TimeSpan.Zero.Clock, "0h00", "no time at all");
Check.Equal(TimeSpan.FromMinutes(59).Clock, "0h59", "under an hour");
Check.Equal(TimeSpan.FromHours(1).Clock, "1h00", "exactly one hour");
Check.Equal(TimeSpan.FromMinutes(605).Clock, "10h05", "ten hours and five minutes");
Check.Equal(new TimeSpan(1, 59, 59).Clock, "1h59", "seconds are left out, not rounded");
Check.Equal(TimeSpan.FromHours(26).Clock, "26h00", "hours are not wrapped at a day");
Check.Equal(new TimeSpan(2, 3, 7, 0).Clock, "51h07", "two days, three hours and seven minutes");

// Driving
Check.Equal(TimeSpan.Driving(60, 60), TimeSpan.FromHours(1), "60 km at 60 km/h");
Check.Equal(TimeSpan.Driving(0, 80), TimeSpan.Zero, "0 km takes no time");
Check.Equal(TimeSpan.Driving(10, 100), TimeSpan.FromMinutes(6), "10 km at 100 km/h");
Check.Equal(TimeSpan.Driving(100, 70), TimeSpan.FromMinutes(86), "100 km at 70 km/h, a time that is not a whole number of minutes");
Check.Equal(TimeSpan.Driving(100, 90), TimeSpan.FromMinutes(67), "100 km at 90 km/h, rounded to the nearest minute");
Check.Equal(TimeSpan.Driving(100, 110), TimeSpan.FromMinutes(55), "100 km at 110 km/h, just past the middle of a minute");
Check.Equal(TimeSpan.Driving(50, 120), TimeSpan.FromMinutes(25), "50 km at 120 km/h, a whole number of minutes");
Check.Equal(TimeSpan.Driving(1, 100), TimeSpan.FromMinutes(1), "a drive of more than half a minute but less than one");
Check.Equal(TimeSpan.Driving(0.5, 100), TimeSpan.Zero, "a drive of less than half a minute");
Check.Equal(TimeSpan.Driving(313, 95), TimeSpan.FromMinutes(198), "313 km at 95 km/h, a longer drive");
Check.Equal(TimeSpan.Driving(1200, 100).Clock, "12h00", "a long drive, shown with Clock");
