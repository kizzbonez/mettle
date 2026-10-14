var book = new Book { Title = "Dune", ShelfMark = "SF HER", Pages = 412, StaffNote = "spine torn" };
Check.Equal(CsvExport.Header(typeof(Book)), "Title,Shelf mark,Pages", "the header of Book");
Check.Equal(CsvExport.Row(book), "Dune,SF HER,412", "the row of one book");

var member = new Member { Name = "Ada Lovelace", CardNumber = 1042, Pin = "0000" };
Check.Equal(CsvExport.Header(typeof(Member)), "Card,Name,Email", "the header of Member");
string row = "";
try
{
    row = CsvExport.Row(member);
}
catch (NullReferenceException)
{
    Check.True(false, "a property whose value is null gives an empty field");
}
Check.Equal(row, "1042,Ada Lovelace,", "the row of a member without an email address");

Check.Equal(CsvExport.Show(book.Pages * 2), "book.Pages * 2 = 824", "Show with the expression book.Pages * 2");
