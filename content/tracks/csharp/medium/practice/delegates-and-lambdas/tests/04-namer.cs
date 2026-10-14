Func<string> holiday = Darkroom.Namer("HOLIDAY");
Check.Equal(holiday(), "HOLIDAY_001", "the first name counts from 1");
Check.Equal(holiday(), "HOLIDAY_002", "the second name");

// Every namer counts on its own.
Func<string> scans = Darkroom.Namer("SCAN");
Check.Equal(scans(), "SCAN_001", "a second namer starts at 1 again");
Check.Equal(holiday(), "HOLIDAY_003", "the first namer goes on from where it was");

Func<string> again = Darkroom.Namer("HOLIDAY");
Check.Equal(again(), "HOLIDAY_001", "a new namer with a prefix already used starts at 1");
Check.Equal(holiday(), "HOLIDAY_004", "the older namer with that prefix is not changed by the new one");

// At least three digits.
Func<string> many = Darkroom.Namer("P");
string last = "";
for (int i = 0; i < 1000; i++)
{
    last = many();
    if (i == 9) Check.Equal(last, "P_010", "the tenth name");
    if (i == 98) Check.Equal(last, "P_099", "the 99th name");
    if (i == 99) Check.Equal(last, "P_100", "the 100th name");
}
Check.Equal(last, "P_1000", "the 1000th name has four digits");

// A prefix can be any text.
Check.Equal(Darkroom.Namer("")(), "_001", "an empty prefix");
Check.Equal(Darkroom.Namer("Summer 2026")(), "Summer 2026_001", "a prefix with a space and digits");

// Making a namer does not count.
Func<string> unused = Darkroom.Namer("X");
Darkroom.Namer("X");
Check.Equal(unused(), "X_001", "making namers does not use up numbers");
