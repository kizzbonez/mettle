// Vending Machine
//
// Setters that check their value through the field keyword, a property only
// its own class can change, an indexer over private slots, and an assignment
// through a reference that may be null.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>One slot of the machine and what is in it.</summary>
public class Slot
{
    // Complete: nothing to write here. It assigns through the setters below.
    public Slot(string product, decimal price, int stock)
    {
        Product = product;
        Price = price;
        Stock = stock;
    }

    public string Product { get; }

    /// <summary>The price; zero or less is refused with ArgumentOutOfRangeException.</summary>
    public decimal Price
    {
        get;
        set => throw new NotImplementedException();
    }

    /// <summary>How many are left; a negative number is stored as 0.</summary>
    public int Stock
    {
        get;
        set => throw new NotImplementedException();
    }
}

public class VendingMachine
{
    private readonly Slot?[] slots;

    // Complete: nothing to write here.
    public VendingMachine(int size) => slots = new Slot?[size];

    /// <summary>The money inserted and not yet spent.</summary>
    // TODO 2: anyone may read it, only the machine may change it.
    public decimal Credit => throw new NotImplementedException();

    /// <summary>Adds a coin of 0.10, 0.20, 0.50, 1 or 2 to the credit.</summary>
    public void Insert(decimal coin)
    {
        throw new NotImplementedException();
    }

    /// <summary>Hands back the whole credit.</summary>
    public decimal Refund()
    {
        throw new NotImplementedException();
    }

    /// <summary>The slot with this number, counting from 1; null when it is empty.</summary>
    public Slot? this[int number]
    {
        get => throw new NotImplementedException();
        set => throw new NotImplementedException();
    }

    /// <summary>Adds to the stock of a slot; an empty slot is skipped.</summary>
    public void Restock(int number, int amount)
    {
        throw new NotImplementedException();
    }
}
