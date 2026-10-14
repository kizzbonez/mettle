var machine = new VendingMachine(2, 2);
Check.True(machine.Press(1) == "Enjoy!", "a press on a slot with items gives Enjoy!");
Check.True(machine.Press(1) == "Enjoy!" && machine.StockOf(1) == 0, "every press that works takes one item");
Check.True(machine.Press(1) == "Slot 1 is sold out", "a press on an empty slot says that it is sold out");
Check.True(machine.StockOf(1) == 0, "a press on an empty slot leaves it at 0");

Check.True(machine.Press(0) == "Slot 0 does not exist", "a press on slot 0 says that it does not exist");
Check.True(machine.Press(-3) == "Slot -3 does not exist", "a press on a negative slot says that it does not exist");
Check.True(machine.Press(12) == "Slot 12 does not exist", "a press past the last slot says that it does not exist");
Check.True(machine.StockOf(2) == 2, "presses on other slots leave slot 2 as it was");

var empty = new VendingMachine(1, 0);
Check.True(empty.Press(1) == "Slot 1 is sold out", "a slot that started empty is sold out");
Check.True(empty.Press(2) == "Slot 2 does not exist", "on an empty machine, a slot that does not exist is reported as one");
