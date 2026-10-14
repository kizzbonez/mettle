// Tool Library Lending Desk
//
// Every `throw new NotImplementedException();` below marks code you still have
// to write. Until you replace one, calling that member stops the test with
// "unexpected NotImplementedException".
//
// Keep every public name, parameter and return type exactly as it is: the
// tests call them. You may add private fields and private methods.

using System.Globalization;

/// <summary>One tool that is out on loan. This class is complete.</summary>
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

    // Suggested storage: the loan for each tool id, and the fees charged to each member id.
    private readonly Dictionary<string, Loan> _loans = new();
    private readonly Dictionary<string, decimal> _fees = new();

    public ToolLibrary(int loanDays, decimal lateFeePerDay)
    {
        // TODO 1: validate both arguments, then set the two properties.
        throw new NotImplementedException();
    }

    public int LoanDays { get; }
    public decimal LateFeePerDay { get; }
    public int OnLoanCount => _loans.Count;

    public static string NormalizeId(string id)
    {
        // TODO 2: reject a blank id, otherwise trim it and convert it to upper case.
        throw new NotImplementedException();
    }

    public void Lend(string toolId, string memberId, int day)
    {
        // TODO 3: check the arguments and the rules in the order of the instructions, then record the loan.
        throw new NotImplementedException();
    }

    public decimal Return(string toolId, int day)
    {
        // TODO 4: check, work out the late fee, remove the loan and charge the member.
        throw new NotImplementedException();
    }

    public string? HolderOf(string toolId)
    {
        throw new NotImplementedException();
    }

    public List<string> ToolsHeldBy(string memberId)
    {
        throw new NotImplementedException();
    }

    public decimal FeesOwedBy(string memberId)
    {
        throw new NotImplementedException();
    }

    public string Describe(string memberId)
    {
        // TODO 5: for example "M1032: 1 tool out, owes 0.50".
        throw new NotImplementedException();
    }
}

/// <summary>Replays the text log that the lending desk keeps.</summary>
public static class DeskLog
{
    public static List<int> Replay(ToolLibrary library, string text)
    {
        // TODO 6: number every line from 1, skip blanks and comments, apply the rest,
        //         and collect the numbers of the lines that could not be applied.
        throw new NotImplementedException();
    }
}
