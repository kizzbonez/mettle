// Values in the same order as the header.
var book = new Book { ShelfMark = "741.5 SPI", Title = "Maus", Pages = 296, StaffNote = "donated" };
Check.Equal(CsvExport.Row(book), "Maus,741.5 SPI,296", "the row of a book, in the order of the header");
Check.True(!CsvExport.Row(book).Contains("donated"), "a property without [Column] is not in the row");

var full = new Member { CardNumber = 7, Name = "Lin", Email = "lin@example.org", Pin = "4321" };
Check.Equal(CsvExport.Row(full), "7,Lin,lin@example.org", "the row of a member with every value set");

// A null value is an empty field.
var noEmail = new Member { CardNumber = 88, Name = "Grace Hopper" };
string row = "";
try
{
    row = CsvExport.Row(noEmail);
}
catch (NullReferenceException)
{
    Check.True(false, "a property whose value is null gives an empty field");
}
Check.Equal(row, "88,Grace Hopper,", "the row of a member whose email is null");

// Empty strings and default numbers are written as they are.
Check.Equal(CsvExport.Row(new Book()), ",,0", "the row of a book with nothing filled in");

// The run-time type decides, whatever the variable's type.
object seenAsObject = new Book { Title = "Emma", ShelfMark = "F AUS", Pages = 474 };
Check.Equal(CsvExport.Row(seenAsObject), "Emma,F AUS,474", "the row of a book held in a variable of type object");

// Rows of different types, one after the other.
Check.Equal(CsvExport.Row(full), "7,Lin,lin@example.org", "a member's row after a book's");
Check.Equal(CsvExport.Row(book), "Maus,741.5 SPI,296", "a book's row after a member's");

// An object without any [Column].
Check.Equal(CsvExport.Row(new Version(2, 1)), "", "the row of an object whose properties have no [Column]");
