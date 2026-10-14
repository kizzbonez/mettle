// Library Loans Desk
//
// Fine rules, a generic waitlist and the morning reports for a library's loans desk.
// Every `throw new NotImplementedException();` marks code you still have to write.
// The rules are in the instructions. Keep all types in the global namespace.

// ---- Given: do not change these three types. ------------------------------------------

public enum MemberKind { Adult, Child, Senior, Staff }

public enum ItemKind { Book, Dvd, Magazine }

/// <summary>One loan. <c>Returned</c> is null while the item is still out.</summary>
public readonly record struct Loan(
    string MemberId, MemberKind Member, ItemKind Item, DateOnly Due, DateOnly? Returned = null);

// ---- 1. Fine rules -----------------------------------------------------------------------

public static class Fines
{
    /// <summary>The fine owed for one loan, checked on <paramref name="today"/>.</summary>
    public static decimal For(Loan loan, DateOnly today)
    {
        // TODO 1: days late, the rate for the item, the member's share, then the cap.
        throw new NotImplementedException();
    }
}

// ---- 2. A generic waitlist ---------------------------------------------------------------

/// <summary>Members waiting for something, in the order they joined.</summary>
public class Waitlist<T> : IEnumerable<T> where T : notnull
{
    // TODO 2: choose the field(s) that keep the waiting members in order.

    public int Count => throw new NotImplementedException();

    /// <summary>Adds the member at the back; false if the member is already waiting.</summary>
    public bool Join(T member) => throw new NotImplementedException();

    /// <summary>Removes the member; false if the member was not waiting.</summary>
    public bool Leave(T member) => throw new NotImplementedException();

    /// <summary>Removes and returns the member at the front.</summary>
    public T Next() => throw new NotImplementedException();

    /// <summary>1 for the front of the line, 0 if the member is not waiting.</summary>
    public int PositionOf(T member) => throw new NotImplementedException();

    /// <summary>Removes every member that matches; returns how many were removed.</summary>
    public int RemoveAll(Predicate<T> match) => throw new NotImplementedException();

    /// <summary>The waiting members, front to back.</summary>
    public IEnumerator<T> GetEnumerator() => throw new NotImplementedException();

    // The non-generic interface that IEnumerable<T> extends; it can reuse the method above.
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
}

// ---- 3. Reports, as extension members on any sequence of loans -----------------------------

public static class LoanReports
{
    extension(IEnumerable<Loan> loans)
    {
        /// <summary>Loans still out and due before today; earliest due first, then by member.</summary>
        public IEnumerable<Loan> Overdue(DateOnly today) => throw new NotImplementedException();

        /// <summary>Each member's total fine, largest first; members owing nothing left out.</summary>
        public IReadOnlyList<(string MemberId, decimal Total)> FinesByMember(DateOnly today) =>
            throw new NotImplementedException();

        /// <summary>How many loans are still out, for every item kind.</summary>
        public IReadOnlyDictionary<ItemKind, int> OpenByKind => throw new NotImplementedException();
    }
}
