var card = new VisitCard("Kofi", 2);
Check.True(card.CheckIn() && card.VisitsLeft == 1, "a check-in takes one visit off the card");
Check.True(card.CheckIn() && card.VisitsLeft == 0, "the last visit on a card can be used");
Check.True(!card.CheckIn(), "a card with no visit left refuses a check-in");
Check.True(!card.CheckIn() && card.VisitsLeft == 0, "refused check-ins never take the visits below 0");

var empty = new VisitCard("Ines", 0);
Check.True(!empty.CheckIn() && empty.VisitsLeft == 0, "a card created with no visits refuses a check-in");

empty.TopUp(3);
Check.True(empty.VisitsLeft == 3, "a top-up adds visits to an empty card");
empty.TopUp(0);
Check.True(empty.VisitsLeft == 3, "a top-up of 0 changes nothing");
empty.TopUp(5);
Check.True(empty.VisitsLeft == 8, "every top-up adds to the visits already on the card");
Check.True(empty.CheckIn() && empty.VisitsLeft == 7, "topped-up visits can be used");

var one = new VisitCard("Ama", 10);
var other = new VisitCard("Bo", 10);
one.CheckIn();
one.CheckIn();
other.TopUp(1);
Check.True(one.VisitsLeft == 8 && other.VisitsLeft == 11, "each card keeps its own visits, separate from every other card");
