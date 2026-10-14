// The example from the instructions.
var today = new DateOnly(2026, 3, 10);
Loan[] loans =
[
    new Loan("M01", MemberKind.Adult, ItemKind.Book, new DateOnly(2026, 3, 1), new DateOnly(2026, 3, 6)),
    new Loan("M02", MemberKind.Child, ItemKind.Dvd, new DateOnly(2026, 3, 7)),
    new Loan("M01", MemberKind.Adult, ItemKind.Dvd, new DateOnly(2026, 2, 1), new DateOnly(2026, 3, 3)),
    new Loan("M03", MemberKind.Staff, ItemKind.Dvd, new DateOnly(2026, 3, 2)),
    new Loan("M04", MemberKind.Senior, ItemKind.Magazine, new DateOnly(2026, 3, 9)),
    new Loan("M02", MemberKind.Child, ItemKind.Book, new DateOnly(2026, 3, 20)),
];

Check.Equal(Fines.For(loans[0], today), 1.00m, "fine for a book returned 5 days late by an adult");
Check.Equal(Fines.For(loans[1], today), 1.50m, "fine for a DVD a child still has, 3 days late");
Check.Equal(Fines.For(loans[2], today), 10.00m, "fine for a DVD returned 30 days late");

Check.SequenceEqual(
    loans.Overdue(today).Select(loan => loan.MemberId),
    new[] { "M03", "M02", "M04" },
    "members with overdue loans, earliest due date first");

Check.SequenceEqual(
    loans.FinesByMember(today),
    new[] { ("M01", 11.00m), ("M02", 1.50m), ("M04", 0.05m) },
    "total fine per member, largest first");

var open = loans.OpenByKind;
Check.Equal(open[ItemKind.Book], 1, "books still out");
Check.Equal(open[ItemKind.Dvd], 2, "DVDs still out");
Check.Equal(open[ItemKind.Magazine], 1, "magazines still out");

var holds = new Waitlist<string>();
Check.True(holds.Join("M01"), "M01 joins an empty waitlist");
Check.True(holds.Join("M02"), "M02 joins behind M01");
Check.True(!holds.Join("M01"), "Join returns false for a member who is already waiting");
Check.Equal(holds.PositionOf("M02"), 2, "position of the second member in line");
Check.Equal(holds.Next(), "M01", "Next serves the front of the line");
Check.Equal(string.Join(",", holds), "M02", "the members still waiting, front to back");
