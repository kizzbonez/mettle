Check.Throws<ArgumentOutOfRangeException>(() => new VendingMachine(0, 5), "a machine with no slots is refused");
Check.Throws<ArgumentOutOfRangeException>(() => new VendingMachine(-2, 5), "a negative number of slots is refused");
Check.Throws<ArgumentOutOfRangeException>(() => new VendingMachine(3, -1), "a negative number of items per slot is refused");
Check.Throws<ArgumentOutOfRangeException>(() => new VendingMachine(0, -1), "a machine that breaks both rules is refused");

var empty = new VendingMachine(1, 0);
Check.True(empty.Slots == 1 && empty.StockOf(1) == 0, "a machine with one slot that starts empty is allowed");

var big = new VendingMachine(4, 6);
Check.True(big.Slots == 4, "the machine has the number of slots it was created with");
Check.True(big.StockOf(1) == 6 && big.StockOf(2) == 6 && big.StockOf(3) == 6 && big.StockOf(4) == 6,
    "every slot, the first and the last included, starts with the items per slot");
