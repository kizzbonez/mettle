var machine = new VendingMachine(3, 1);
Check.Throws<ArgumentOutOfRangeException>(() => machine.Buy(0), "slot 0 does not exist, because slots are numbered from 1");
Check.Throws<ArgumentOutOfRangeException>(() => machine.Buy(4), "a slot one past the last slot does not exist");
Check.Throws<ArgumentOutOfRangeException>(() => machine.Buy(-1), "a negative slot does not exist");
Check.True(machine.StockOf(1) == 1 && machine.StockOf(2) == 1 && machine.StockOf(3) == 1,
    "a refused purchase from a slot that does not exist changes nothing");

machine.Buy(3);
Check.True(machine.StockOf(3) == 0 && machine.StockOf(1) == 1 && machine.StockOf(2) == 1,
    "a purchase takes one item from its own slot only, and the last slot can be bought from");
Check.Throws<InvalidOperationException>(() => machine.Buy(3), "an empty slot refuses a purchase");
Check.True(machine.StockOf(3) == 0, "a refused purchase from an empty slot leaves it at 0");

string message = "";
try { machine.Buy(17); }
catch (ArgumentOutOfRangeException error) { message = error.Message; }
Check.True(message.Contains("17"), "the message for a slot that does not exist names the slot number");

message = "";
try { machine.Buy(3); }
catch (InvalidOperationException error) { message = error.Message; }
Check.True(message.Contains('3'), "the message for an empty slot names the slot number");

var bare = new VendingMachine(2, 0);
Check.Throws<ArgumentOutOfRangeException>(() => bare.Buy(9),
    "on a machine with empty slots, a slot that does not exist is still reported as one, because that is checked first");
