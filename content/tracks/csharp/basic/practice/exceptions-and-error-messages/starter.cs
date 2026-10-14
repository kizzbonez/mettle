// Vending Machine
//
// One class for a vending machine's software. Keep every public name,
// parameter and type exactly as it is: the tests use them. You may add
// private fields and private methods.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public class VendingMachine
{
    // The items left in each slot. Slot 1 is _stock[0].
    private readonly int[] _stock = [];

    // Refuses fewer than 1 slot or a negative number of items, then fills every slot.
    public VendingMachine(int slots, int itemsPerSlot)
    {
        throw new NotImplementedException();
    }

    // The number of slots. This property is complete.
    public int Slots => _stock.Length;

    // The items left in a slot, numbered from 1. This method is complete.
    public int StockOf(int slot) => _stock[slot - 1];

    // Takes one item out of a slot, or throws the exception the instructions name.
    public void Buy(int slot)
    {
        throw new NotImplementedException();
    }

    // Calls Buy and turns its result into the text on the button.
    public string Press(int slot)
    {
        throw new NotImplementedException();
    }
}
