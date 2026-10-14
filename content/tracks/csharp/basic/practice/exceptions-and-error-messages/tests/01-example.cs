// The example from the instructions. Check.Throws runs the code in its
// parentheses and passes only when it throws the named exception.
var machine = new VendingMachine(3, 2);
machine.Buy(2);
machine.Buy(2);
Check.Equal(machine.StockOf(2), 0, "the items left in slot 2 after two purchases");
Check.Throws<InvalidOperationException>(() => machine.Buy(2), "Buy throws InvalidOperationException for the empty slot 2");
Check.Equal(machine.Press(2), "Slot 2 is sold out", "the text of the button for the empty slot 2");
Check.Equal(machine.Press(5), "Slot 5 does not exist", "the text of the button for slot 5 on a machine with 3 slots");
Check.Equal(machine.Press(1), "Enjoy!", "the text of the button for slot 1, which has items");
Check.Equal(machine.StockOf(1), 1, "the items left in slot 1 after one press");
Check.Throws<ArgumentOutOfRangeException>(() => new VendingMachine(0, 5),
    "the constructor throws ArgumentOutOfRangeException for a machine with 0 slots");
