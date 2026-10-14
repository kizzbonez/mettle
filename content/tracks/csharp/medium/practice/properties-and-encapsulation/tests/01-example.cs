// The example from the instructions. Check.Throws runs the code after "() =>"
// and passes when that code throws the exception named in the angle brackets.
var machine = new VendingMachine(3);
machine[1] = new Slot("Water", 0.90m, 5);
machine[2] = new Slot("Crisps", 1.20m, 0);
Check.Equal(machine[1]!.Product, "Water", "the product in slot 1");
Check.True(machine[3] is null, "slot 3, which is empty");
Check.Throws<ArgumentOutOfRangeException>(() => _ = machine[4], "reading slot 4 of a machine with 3 slots");

machine.Insert(1m);
machine.Insert(0.20m);
Check.Equal(machine.Credit, 1.20m, "the credit after inserting 1 and 0.20");
Check.Throws<ArgumentException>(() => machine.Insert(0.05m), "inserting a coin of 0.05");

machine[2]!.Stock = -4;
Check.Equal(machine[2]!.Stock, 0, "the stock after setting it to -4");
machine.Restock(2, 6);
Check.Equal(machine[2]!.Stock, 6, "the stock of slot 2 after restocking it with 6");
machine.Restock(3, 6);
Check.True(machine[3] is null, "slot 3 after restocking it while it is empty");

Check.Throws<ArgumentOutOfRangeException>(() => machine[1]!.Price = 0m, "setting a price of 0");
Check.Equal(machine[1]!.Price, 0.90m, "the price of slot 1 after the refused change");

Check.Equal(machine.Refund(), 1.20m, "the money Refund hands back");
Check.Equal(machine.Credit, 0m, "the credit after a refund");
