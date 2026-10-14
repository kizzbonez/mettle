string printed = Printed.By(() => Honey.Report());

string[] words = printed.Split(' ');
Check.True(words[0] == "4",
    "the number of hives at the start of the line, which the program takes from the list");
