// Library Export
//
// A [Column] attribute labels the properties that go into a CSV export. Read
// the labels with reflection to build a header and a row for any type, and
// let the compiler tell you what the caller wrote with CallerArgumentExpression.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

using System.Reflection;
using System.Runtime.CompilerServices;

/// Marks a property that goes into the CSV export, under a column title.
[AttributeUsage(AttributeTargets.Property)]
public sealed class ColumnAttribute(string title) : Attribute
{
    public string Title { get; } = title;

    /// Where the column goes: lower numbers come first.
    public int Order { get; set; }
}

public sealed class Book
{
    [Column("Shelf mark", Order = 2)]
    public string ShelfMark { get; set; } = "";

    [Column("Title", Order = 1)]
    public string Title { get; set; } = "";

    [Column("Pages", Order = 3)]
    public int Pages { get; set; }

    /// Not exported: it has no [Column].
    public string StaffNote { get; set; } = "";
}

public sealed class Member
{
    /// Not exported: it has no [Column].
    public string Pin { get; set; } = "";

    [Column("Email", Order = 30)]
    public string? Email { get; set; }

    [Column("Card", Order = 10)]
    public int CardNumber { get; set; }

    [Column("Name", Order = 20)]
    public string Name { get; set; } = "";
}

public static class CsvExport
{
    /// The column titles of a type, in column order.
    public static string Header(Type type)
    {
        // TODO 1
        throw new NotImplementedException();
    }

    /// The values of one item, in column order.
    public static string Row(object item)
    {
        // TODO 2
        throw new NotImplementedException();
    }

    /// "{expression} = {value}", where the compiler supplies the expression.
    // TODO 3: add [CallerArgumentExpression(nameof(value))] to the expression parameter
    public static string Show(object? value, string expression = "")
    {
        // TODO 3
        throw new NotImplementedException();
    }
}
