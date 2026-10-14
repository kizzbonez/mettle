// Library Loans Desk: reference solution.

public enum MemberKind { Adult, Child, Senior, Staff }

public enum ItemKind { Book, Dvd, Magazine }

/// <summary>One loan. <c>Returned</c> is null while the item is still out.</summary>
public readonly record struct Loan(
    string MemberId, MemberKind Member, ItemKind Item, DateOnly Due, DateOnly? Returned = null);

public static class Fines
{
    private const decimal Cap = 10.00m;

    /// <summary>The fine owed for one loan, checked on <paramref name="today"/>.</summary>
    public static decimal For(Loan loan, DateOnly today)
    {
        DateOnly chargedUntil = loan.Returned ?? today;
        int daysLate = chargedUntil.DayNumber - loan.Due.DayNumber;
        if (daysLate <= 0) return 0m;

        decimal dailyRate = loan.Item switch
        {
            ItemKind.Book => 0.20m,
            ItemKind.Dvd => 1.00m,
            ItemKind.Magazine => 0.10m,
            _ => throw new ArgumentOutOfRangeException(nameof(loan), $"Unknown item kind {loan.Item}."),
        };

        decimal share = loan.Member switch
        {
            MemberKind.Staff => 0m,
            MemberKind.Child or MemberKind.Senior => 0.5m,
            _ => 1m,
        };

        return Math.Min(Cap, daysLate * dailyRate * share);
    }
}

/// <summary>Members waiting for something, in the order they joined.</summary>
public class Waitlist<T> : IEnumerable<T> where T : notnull
{
    private readonly List<T> waiting = new();

    public int Count => waiting.Count;

    public bool Join(T member)
    {
        if (waiting.Contains(member)) return false;
        waiting.Add(member);
        return true;
    }

    public bool Leave(T member) => waiting.Remove(member);

    public T Next()
    {
        if (waiting.Count == 0) throw new InvalidOperationException("Nobody is waiting.");
        T first = waiting[0];
        waiting.RemoveAt(0);
        return first;
    }

    public int PositionOf(T member) => waiting.IndexOf(member) + 1;

    public int RemoveAll(Predicate<T> match) => waiting.RemoveAll(match);

    public IEnumerator<T> GetEnumerator() => waiting.GetEnumerator();

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
}

public static class LoanReports
{
    extension(IEnumerable<Loan> loans)
    {
        public IEnumerable<Loan> Overdue(DateOnly today) =>
            loans.Where(loan => loan.Returned is null && loan.Due < today)
                 .OrderBy(loan => loan.Due)
                 .ThenBy(loan => loan.MemberId, StringComparer.Ordinal);

        public IReadOnlyList<(string MemberId, decimal Total)> FinesByMember(DateOnly today) =>
            loans.GroupBy(loan => loan.MemberId)
                 .Select(group => (MemberId: group.Key, Total: group.Sum(loan => Fines.For(loan, today))))
                 .Where(row => row.Total > 0m)
                 .OrderByDescending(row => row.Total)
                 .ThenBy(row => row.MemberId, StringComparer.Ordinal)
                 .ToList();

        public IReadOnlyDictionary<ItemKind, int> OpenByKind
        {
            get
            {
                var counts = Enum.GetValues<ItemKind>().ToDictionary(kind => kind, _ => 0);
                foreach (Loan loan in loans)
                {
                    if (loan.Returned is null) counts[loan.Item]++;
                }
                return counts;
            }
        }
    }
}
