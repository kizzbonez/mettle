var card = new VisitCard("Grace Hopper", 0) { Locker = "A1" };
Check.True(card.Describe() == "Card 1, Grace Hopper: 0 visits left, locker A1", "a card with no visit left uses the plural visits");

card.TopUp(1);
Check.True(card.Describe() == "Card 1, Grace Hopper: 1 visit left, locker A1", "a card with exactly one visit left uses the singular visit");

card.TopUp(1);
card.Locker = "D4";
Check.True(card.Describe() == "Card 1, Grace Hopper: 2 visits left, locker D4", "the line follows the visits and the locker as they change");

var next = new VisitCard("Ola", 25);
Check.True(next.Describe() == "Card 2, Ola: 25 visits left, locker none", "the line shows the card's own number, and the locker none when none was set");
