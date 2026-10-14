// Titles, not property names, sorted by Order rather than by declaration.
Check.Equal(CsvExport.Header(typeof(Book)), "Title,Shelf mark,Pages", "the header of Book, in the order of the Order values");
Check.Equal(CsvExport.Header(typeof(Member)), "Card,Name,Email", "the header of Member, in the order of the Order values");

// The same answer every time, and for a type found at run time.
Check.Equal(CsvExport.Header(typeof(Book)), "Title,Shelf mark,Pages", "the header of Book, asked for a second time");
object something = new Member();
Check.Equal(CsvExport.Header(something.GetType()), "Card,Name,Email", "the header of a type found with GetType()");

// Properties without [Column] are left out.
Check.True(!CsvExport.Header(typeof(Book)).Contains("Staff"), "a property without [Column] is not in the header");
Check.True(!CsvExport.Header(typeof(Member)).Contains("Pin"), "a member's Pin has no [Column] and is not in the header");

// Types without any [Column] at all.
Check.Equal(CsvExport.Header(typeof(object)), "", "the header of a type without properties");
Check.Equal(CsvExport.Header(typeof(Version)), "", "the header of a type whose properties have no [Column]");
Check.Equal(CsvExport.Header(typeof(TimeSpan)), "", "the header of a struct whose properties have no [Column]");
