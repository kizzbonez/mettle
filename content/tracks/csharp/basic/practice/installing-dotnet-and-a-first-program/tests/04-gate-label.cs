string printed = Printed.By(() => FerryBoard.GateLabel());

Check.True(printed.Length > 0, "GateLabel prints something");
Check.True(!printed.Contains('\n'),
    "GateLabel does not end its line, so the gate number can follow on the same line");
Check.True(printed == "Board at gate ",
    "the text of the gate label, with exactly one space at the end");
