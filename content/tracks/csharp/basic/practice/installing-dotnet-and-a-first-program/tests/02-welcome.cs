string printed = Printed.By(() => FerryBoard.Welcome());

Check.True(printed.EndsWith('\n') && printed.Split('\n').Length == 2,
    "Welcome prints exactly one line and ends it");
Check.True(printed == "Welcome to Harbour Quay!\n",
    "the text of the welcome line, with its capital letters and the exclamation mark, and no extra spaces");
