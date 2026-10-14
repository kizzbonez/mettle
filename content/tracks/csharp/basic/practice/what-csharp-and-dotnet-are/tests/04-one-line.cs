string printed = Printed.By(() => Honey.Report());

Check.True(printed != "3 hives gave 9.75 kg of honey\n",
    "the program no longer prints the starter's line, because the list has changed");
Check.True(printed.EndsWith('\n') && printed.Split('\n').Length == 2,
    "the program prints exactly one line, ended by WriteLine");

string[] words = printed.TrimEnd('\n').Split(' ');
Check.True(words.Length == 7, "the line still has seven words, each separated by one space");
Check.True(words[1] == "hives" && words[2] == "gave" && words[4] == "kg" && words[5] == "of" && words[6] == "honey",
    "the words of the line are the ones the starter had, with nothing added");
Check.True(int.TryParse(words[0], out int _) && double.TryParse(words[3], out double _),
    "the first word of the line is a whole number and the fourth is a number");
