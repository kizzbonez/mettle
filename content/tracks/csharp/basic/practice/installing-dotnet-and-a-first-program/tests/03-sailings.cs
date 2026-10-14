string printed = Printed.By(() => FerryBoard.Sailings());

Check.True(!printed.Contains("Staff") && !printed.Contains("captain"),
    "the note for the staff is a comment now, so it is not printed");

string[] lines = printed.Split('\n');
Check.True(lines.Length == 3 && lines[2] == "",
    "Sailings prints exactly two lines and ends both of them");
Check.True(lines[0] == "07:45 Gull Island",
    "the first line is the 07:45 sailing, written exactly as in the instructions");
Check.True(lines[1] == "09:30 Little Skerry",
    "the second line is the 09:30 sailing, written exactly as in the instructions");
