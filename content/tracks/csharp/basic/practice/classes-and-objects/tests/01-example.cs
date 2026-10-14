// The example from the instructions: two cards, created with new, checked
// in, topped up and described.
var ada = new VisitCard("Ada", 5) { Locker = "B7" };
var ben = new VisitCard("Ben", 1);
Check.Equal(ada.Number, 1, "the number of the first card created");
Check.Equal(ben.Number, 2, "the number of the second card created");
Check.Equal(VisitCard.Issued, 2, "the cards issued after two were created");
Check.Equal(ben.Describe(), "Card 2, Ben: 1 visit left, locker none", "Ben's card before any visit");

Check.Equal(ada.CheckIn(), true, "whether Ada can check in with 5 visits left");
Check.Equal(ada.VisitsLeft, 4, "Ada's visits left after checking in once");
Check.Equal(ben.CheckIn(), true, "whether Ben can check in with 1 visit left");
Check.Equal(ben.CheckIn(), false, "whether Ben can check in again with no visit left");
Check.Equal(ben.VisitsLeft, 0, "Ben's visits left after a refused check-in");

ben.TopUp(10);
Check.Equal(ben.VisitsLeft, 10, "Ben's visits left after a top-up of 10");
Check.Equal(ada.Describe(), "Card 1, Ada: 4 visits left, locker B7", "Ada's card after one visit");
