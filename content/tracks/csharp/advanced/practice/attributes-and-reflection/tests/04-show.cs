// The compiler writes in the source text of each argument.
int copies = 3;
Check.Equal(CsvExport.Show(copies), "copies = 3", "Show with a variable");
Check.Equal(CsvExport.Show(copies + 1), "copies + 1 = 4", "Show with an arithmetic expression");
Check.Equal(CsvExport.Show(Math.Max(2, 5)), "Math.Max(2, 5) = 5", "Show with a method call");
Check.Equal(CsvExport.Show("late"), "\"late\" = late", "Show with a string literal");

var member = new Member { Name = "Lin", CardNumber = 7 };
Check.Equal(CsvExport.Show(member.Name), "member.Name = Lin", "Show with a property of a variable");
Check.Equal(CsvExport.Show(member.Email), "member.Email = ", "Show with a property whose value is null");
Check.Equal(CsvExport.Show(null), "null = ", "Show with the literal null");

// A caller may still pass the expression itself.
Check.Equal(CsvExport.Show(42, "the answer"), "the answer = 42", "Show with an expression given by the caller");
