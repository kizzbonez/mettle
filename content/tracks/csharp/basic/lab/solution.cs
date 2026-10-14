// Tool Library Lending Desk: reference solution.

using System.Globalization;

/// <summary>One tool that is out on loan.</summary>
public class Loan
{
    public Loan(string toolId, string memberId, int dayLent)
    {
        ToolId = toolId;
        MemberId = memberId;
        DayLent = dayLent;
    }

    public string ToolId { get; }
    public string MemberId { get; }
    public int DayLent { get; }
}

/// <summary>Which tool is with which member, and what each member owes in late fees.</summary>
public class ToolLibrary
{
    public const int MaxToolsPerMember = 3;

    private readonly Dictionary<string, Loan> _loans = new();
    private readonly Dictionary<string, decimal> _fees = new();

    public ToolLibrary(int loanDays, decimal lateFeePerDay)
    {
        if (loanDays < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(loanDays), "A loan lasts at least one day.");
        }
        if (lateFeePerDay < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(lateFeePerDay), "A late fee cannot be negative.");
        }
        LoanDays = loanDays;
        LateFeePerDay = lateFeePerDay;
    }

    public int LoanDays { get; }
    public decimal LateFeePerDay { get; }
    public int OnLoanCount => _loans.Count;

    public static string NormalizeId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException("An id cannot be blank.", nameof(id));
        }
        return id.Trim().ToUpperInvariant();
    }

    public void Lend(string toolId, string memberId, int day)
    {
        string tool = NormalizeId(toolId);
        string member = NormalizeId(memberId);
        if (day < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(day), "A day cannot be negative.");
        }
        if (_loans.ContainsKey(tool))
        {
            throw new InvalidOperationException($"{tool} is already on loan.");
        }
        if (ToolsHeldBy(member).Count >= MaxToolsPerMember)
        {
            throw new InvalidOperationException($"{member} already has {MaxToolsPerMember} tools.");
        }
        _loans[tool] = new Loan(tool, member, day);
    }

    public decimal Return(string toolId, int day)
    {
        string tool = NormalizeId(toolId);
        if (!_loans.TryGetValue(tool, out Loan? loan))
        {
            throw new InvalidOperationException($"{tool} is not on loan.");
        }
        if (day < loan.DayLent)
        {
            throw new ArgumentOutOfRangeException(nameof(day), "A tool cannot come back before it went out.");
        }
        int lateDays = day - loan.DayLent - LoanDays;
        decimal fee = lateDays > 0 ? lateDays * LateFeePerDay : 0m;
        _loans.Remove(tool);
        _fees[loan.MemberId] = _fees.GetValueOrDefault(loan.MemberId) + fee;
        return fee;
    }

    public string? HolderOf(string toolId)
    {
        string tool = NormalizeId(toolId);
        return _loans.TryGetValue(tool, out Loan? loan) ? loan.MemberId : null;
    }

    public List<string> ToolsHeldBy(string memberId)
    {
        string member = NormalizeId(memberId);
        var tools = new List<string>();
        foreach (Loan loan in _loans.Values)
        {
            if (loan.MemberId == member)
            {
                tools.Add(loan.ToolId);
            }
        }
        tools.Sort(StringComparer.Ordinal);
        return tools;
    }

    public decimal FeesOwedBy(string memberId)
    {
        return _fees.GetValueOrDefault(NormalizeId(memberId));
    }

    public string Describe(string memberId)
    {
        string member = NormalizeId(memberId);
        int count = ToolsHeldBy(member).Count;
        string tools = count == 1 ? "tool" : "tools";
        string fees = FeesOwedBy(member).ToString("F2", CultureInfo.InvariantCulture);
        return $"{member}: {count} {tools} out, owes {fees}";
    }
}

/// <summary>Replays the text log that the lending desk keeps.</summary>
public static class DeskLog
{
    public static List<int> Replay(ToolLibrary library, string text)
    {
        var rejected = new List<int>();
        string[] lines = text.Split('\n');
        for (int i = 0; i < lines.Length; i++)
        {
            string line = lines[i].Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }
            if (!TryApply(library, line))
            {
                rejected.Add(i + 1);
            }
        }
        return rejected;
    }

    private static bool TryApply(ToolLibrary library, string line)
    {
        string[] fields = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (fields.Length < 3 || !int.TryParse(fields[0], out int day) || day < 0)
        {
            return false;
        }
        try
        {
            if (fields[1] == "OUT" && fields.Length == 4)
            {
                library.Lend(fields[2], fields[3], day);
                return true;
            }
            if (fields[1] == "IN" && fields.Length == 3)
            {
                library.Return(fields[2], day);
                return true;
            }
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}
