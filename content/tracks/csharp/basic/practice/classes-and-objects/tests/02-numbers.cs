Check.True(VisitCard.Issued == 0, "no card has been issued before the first one is created");

var first = new VisitCard("Noor", 3);
Check.True(VisitCard.Issued == 1 && first.Number == 1, "the first card created is number 1, and one card has been issued");

var second = new VisitCard("Sam", 0);
var third = new VisitCard("Lin Mei", 12);
Check.True(second.Number == 2 && third.Number == 3, "every new card gets the next number");
Check.True(first.Number == 1, "creating more cards does not change the number of an earlier one");
Check.True(VisitCard.Issued == 3, "Issued counts every card created so far");

Check.True(first.Owner == "Noor" && third.Owner == "Lin Mei", "each card keeps the owner it was created with");
Check.True(first.VisitsLeft == 3 && second.VisitsLeft == 0 && third.VisitsLeft == 12,
    "each card starts with the visits it was created with");
Check.True(first.Locker == "none", "a card created without a locker has the locker none");
first.Locker = "C2";
Check.True(first.Locker == "C2" && second.Locker == "none", "changing one card's locker leaves the others alone");
