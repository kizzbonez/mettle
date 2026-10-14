// Every fine rule on its own. All loans are due on 10 May 2026.
var due = new DateOnly(2026, 5, 10);
var later = new DateOnly(2026, 6, 30);

decimal Fine(MemberKind member, ItemKind item, DateOnly? returned, DateOnly today) =>
    Fines.For(new Loan("X1", member, item, due, returned), today);

// Dates.
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, due, later), 0m,
    "a loan returned on its due date");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, due.AddDays(-3), later), 0m,
    "a loan returned before its due date");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, due.AddDays(2), later), 0.40m,
    "a returned loan is charged up to its return date, not up to today");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, null, due.AddDays(7)), 1.40m,
    "a loan still out is charged up to today");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, null, due), 0m,
    "a loan still out on its due date");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, null, due.AddDays(-1)), 0m,
    "a loan still out that is not yet due");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, new DateOnly(2026, 6, 2), later), 4.60m,
    "days late counted across the end of a month");

// Rates by item.
Check.Equal(Fine(MemberKind.Adult, ItemKind.Book, due.AddDays(1), later), 0.20m,
    "daily rate for a book");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Dvd, due.AddDays(2), later), 2.00m,
    "daily rate for a DVD");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Magazine, due.AddDays(4), later), 0.40m,
    "daily rate for a magazine");

// Shares by member.
Check.Equal(Fine(MemberKind.Child, ItemKind.Book, due.AddDays(3), later), 0.30m,
    "what a child pays for a late book");
Check.Equal(Fine(MemberKind.Senior, ItemKind.Dvd, due.AddDays(3), later), 1.50m,
    "what a senior pays for a late DVD");
Check.Equal(Fine(MemberKind.Staff, ItemKind.Dvd, due.AddDays(40), later), 0m,
    "what staff pay for a very late DVD");

// The cap.
Check.Equal(Fine(MemberKind.Adult, ItemKind.Dvd, due.AddDays(10), later), 10.00m,
    "a fine of exactly the cap");
Check.Equal(Fine(MemberKind.Adult, ItemKind.Dvd, due.AddDays(11), later), 10.00m,
    "a fine just above the cap");
Check.Equal(Fine(MemberKind.Child, ItemKind.Dvd, due.AddDays(25), later), 10.00m,
    "the cap is applied after the discount");
Check.Equal(Fine(MemberKind.Child, ItemKind.Dvd, due.AddDays(16), later), 8.00m,
    "a discounted fine that stays below the cap");
