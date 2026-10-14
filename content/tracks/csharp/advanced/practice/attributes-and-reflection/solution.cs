// Library Export
//
// A [Column] attribute labels the properties that go into a CSV export. Read
// the labels with reflection to build a header and a row for any type, and
// let the compiler tell you what the caller wrote with CallerArgumentExpression.

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
    public static string Header(Type type) =>
        string.Join(",", Columns(type).Select(column => column.Attribute.Title));

    /// The values of one item, in column order.
    public static string Row(object item) =>
        string.Join(",", Columns(item.GetType()).Select(column => column.Property.GetValue(item)?.ToString() ?? ""));

    /// "{expression} = {value}", where the compiler supplies the expression.
    public static string Show(object? value, [CallerArgumentExpression(nameof(value))] string expression = "") =>
        $"{expression} = {value}";

    // The labelled properties of a type, sorted by Order. GetProperties promises
    // no order of its own. (A busy exporter would look this up once per type and
    // keep the result.)
    private static List<(PropertyInfo Property, ColumnAttribute Attribute)> Columns(Type type)
    {
        var columns = new List<(PropertyInfo Property, ColumnAttribute Attribute)>();
        foreach (PropertyInfo property in type.GetProperties())
        {
            if (property.GetCustomAttribute<ColumnAttribute>() is { } column)
                columns.Add((property, column));
        }
        return columns.OrderBy(column => column.Attribute.Order).ToList();
    }
}
