string printed = Printed.By(() => Honey.Report());

// The total is the fourth word of "N hives gave T kg of honey".
string[] words = printed.Split(' ');
Check.True(words.Length > 3 && words[3] == "12.5",
    "the total in the line: the three old hives plus the 2.75 kg of the new one");
