// Ties, exclusions, empty input and reading the input only once.
var today = new DateOnly(2026, 9, 15);
DateOnly Sept(int day) => new DateOnly(2026, 9, day);

List<Loan> loans =
[
    new Loan("B7", MemberKind.Adult, ItemKind.Book, Sept(10)),                // out, owes 1.00
    new Loan("A2", MemberKind.Adult, ItemKind.Magazine, Sept(5)),             // out, owes 1.00
    new Loan("C1", MemberKind.Staff, ItemKind.Dvd, Sept(1)),                  // out, owes nothing
    new Loan("Z9", MemberKind.Senior, ItemKind.Dvd, Sept(12), Sept(14)),      // returned, owes 1.00
    new Loan("A2", MemberKind.Child, ItemKind.Book, Sept(15)),                // out, due today
    new Loan("M5", MemberKind.Adult, ItemKind.Dvd, Sept(13)),                 // out, owes 2.00
    new Loan("A1", MemberKind.Adult, ItemKind.Book, Sept(10)),                // out, owes 1.00
    new Loan("Q4", MemberKind.Adult, ItemKind.Book, Sept(1), Sept(1)),        // returned on time
];

Check.SequenceEqual(
    loans.Overdue(today).Select(loan => loan.MemberId),
    new[] { "C1", "A2", "A1", "B7", "M5" },
    "overdue loans: only unreturned loans due before today, by due date and then member id");

Check.SequenceEqual(
    loans.FinesByMember(today),
    new[] { ("M5", 2.00m), ("A1", 1.00m), ("A2", 1.00m), ("B7", 1.00m), ("Z9", 1.00m) },
    "fines per member: members owing nothing left out, equal totals ordered by member id");

var open = loans.OpenByKind;
Check.Equal(open.Count, 3, "OpenByKind has an entry for every item kind");
Check.Equal(open[ItemKind.Book], 3, "books still out, including one due today");
Check.Equal(open[ItemKind.Dvd], 2, "DVDs still out, not counting returned ones");
Check.Equal(open[ItemKind.Magazine], 1, "magazines still out");

// No loans at all.
var none = new List<Loan>();
Check.True(!none.Overdue(today).Any(), "Overdue with no loans");
Check.Equal(none.FinesByMember(today).Count, 0, "FinesByMember with no loans");
Check.Equal(none.OpenByKind.Count, 3, "OpenByKind lists every item kind even with no loans");
Check.True(none.OpenByKind.Values.All(count => count == 0), "OpenByKind counts with no loans");

// Only staff and returned-on-time loans: nobody owes anything.
Loan[] nothingOwed =
[
    new Loan("S1", MemberKind.Staff, ItemKind.Dvd, Sept(1)),
    new Loan("S2", MemberKind.Adult, ItemKind.Book, Sept(1), Sept(1)),
];
Check.Equal(nothingOwed.FinesByMember(today).Count, 0, "FinesByMember when every total is zero");

// The input is a stream: each report may read it only once.
int reads = 0;
IEnumerable<Loan> Stream()
{
    reads++;
    foreach (Loan loan in loans)
    {
        yield return loan;
    }
}

var streamed = Stream().FinesByMember(today);
Check.Equal(reads, 1, "how many times FinesByMember read its input");
Check.Equal(streamed.Count, 5, "FinesByMember over a stream");

reads = 0;
var openStreamed = Stream().OpenByKind;
Check.Equal(reads, 1, "how many times OpenByKind read its input");
Check.Equal(openStreamed[ItemKind.Book], 3, "OpenByKind over a stream");

reads = 0;
var overdueStreamed = Stream().Overdue(today).ToList();
Check.Equal(reads, 1, "how many times one enumeration of Overdue read its input");
Check.Equal(overdueStreamed.Count, 5, "Overdue over a stream");
