Check.True(HostelDesk.AverageRating([]) is null, "an empty array of ratings has no average");
Check.True(HostelDesk.AverageRating([null]) is null, "a single missing rating gives no average");
Check.True(HostelDesk.AverageRating([3]) == 3.0, "the average of a single rating is that rating");
Check.True(HostelDesk.AverageRating([null, 4]) == 4.0, "a missing rating is left out of the count");
Check.True(HostelDesk.AverageRating([1, 2]) == 1.5, "the average keeps its fractional part");
Check.True(HostelDesk.AverageRating([2, null, 3, null, 5]) == 10.0 / 3,
    "only the ratings that have a value are added up and counted");
Check.True(HostelDesk.AverageRating([0, 0]) == 0.0, "a rating of 0 is a real rating, so two of them average 0, not null");
Check.True(HostelDesk.AverageRating([0, null, 5]) == 2.5, "a rating of 0 counts toward the number of ratings");
