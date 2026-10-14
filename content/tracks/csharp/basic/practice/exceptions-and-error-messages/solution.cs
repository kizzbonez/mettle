// Vending Machine
//
// One class for a vending machine's software. Keep every public name,
// parameter and type exactly as it is: the tests use them. You may add
// private fields and private methods.

public class VendingMachine
{
    // The items left in each slot. Slot 1 is _stock[0].
    private readonly int[] _stock = [];

    // Refuses fewer than 1 slot or a negative number of items, then fills every slot.
    public VendingMachine(int slots, int itemsPerSlot)
    {
        if (slots < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(slots), $"A machine needs at least 1 slot, not {slots}.");
        }
        if (itemsPerSlot < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(itemsPerSlot), $"A slot cannot hold {itemsPerSlot} items.");
        }
        _stock = new int[slots];
        for (int i = 0; i < slots; i++)
        {
            _stock[i] = itemsPerSlot;
        }
    }

    // The number of slots. This property is complete.
    public int Slots => _stock.Length;

    // The items left in a slot, numbered from 1. This method is complete.
    public int StockOf(int slot) => _stock[slot - 1];

    // Takes one item out of a slot, or throws the exception the instructions name.
    public void Buy(int slot)
    {
        if (slot < 1 || slot > Slots)
        {
            throw new ArgumentOutOfRangeException(nameof(slot), $"Slot {slot} does not exist.");
        }
        if (_stock[slot - 1] == 0)
        {
            throw new InvalidOperationException($"Slot {slot} is sold out.");
        }
        _stock[slot - 1]--;
    }

    // Calls Buy and turns its result into the text on the button.
    public string Press(int slot)
    {
        try
        {
            Buy(slot);
            return "Enjoy!";
        }
        catch (ArgumentOutOfRangeException)
        {
            return $"Slot {slot} does not exist";
        }
        catch (InvalidOperationException)
        {
            return $"Slot {slot} is sold out";
        }
    }
}
