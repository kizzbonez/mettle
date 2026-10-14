var machine = new VendingMachine(4);
for (int number = 1; number <= 4; number++)
{
    Check.True(machine[number] is null, "every slot of a new machine is empty");
}

// The indexer reads and writes by number, from 1.
var tea = new Slot("Tea", 1.10m, 2);
machine[1] = tea;
machine[4] = new Slot("Soup", 2.40m, 1);
Check.True(ReferenceEquals(machine[1], tea), "slot 1 holds the slot object written to it");
Check.Equal(machine[4]!.Product, "Soup", "the last slot is number 4");
Check.True(machine[2] is null && machine[3] is null, "the slots in between stay empty");
machine[1] = new Slot("Coffee", 1.30m, 3);
Check.Equal(machine[1]!.Product, "Coffee", "writing to a full slot replaces what was in it");
machine[4] = null;
Check.True(machine[4] is null, "writing null empties a slot");

// Numbers outside the machine.
foreach (int outside in new[] { 0, 5, -1, 100 })
{
    Check.Throws<ArgumentOutOfRangeException>(() => _ = machine[outside], $"reading slot {outside} of a machine with 4 slots");
    Check.Throws<ArgumentOutOfRangeException>(() => machine[outside] = tea, $"writing slot {outside} of a machine with 4 slots");
}

// Restock
machine.Restock(1, 5);
Check.Equal(machine[1]!.Stock, 8, "restocking adds to the stock that is there");
machine.Restock(1, -20);
Check.Equal(machine[1]!.Stock, 0, "restocking goes through the Stock setter, which stores 0 for a negative result");
machine.Restock(2, 5);
Check.True(machine[2] is null, "restocking an empty slot leaves it empty");
machine.Restock(4, 5);
Check.True(machine[4] is null, "restocking a slot that was emptied leaves it empty");
Check.Throws<ArgumentOutOfRangeException>(() => machine.Restock(5, 1), "restocking slot 5 of a machine with 4 slots");
Check.Throws<ArgumentOutOfRangeException>(() => machine.Restock(0, 1), "restocking slot 0");

// Two machines keep their own slots.
var other = new VendingMachine(1);
other[1] = new Slot("Tea", 1.10m, 7);
Check.Equal(machine[1]!.Product, "Coffee", "a second machine does not change the first");
