// Vending Machine
//
// Setters that check their value through the field keyword, a property only
// its own class can change, an indexer over private slots, and an assignment
// through a reference that may be null.

/// <summary>One slot of the machine and what is in it.</summary>
public class Slot
{
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
        set => field = value > 0
            ? value
            : throw new ArgumentOutOfRangeException(nameof(value), "A price must be more than 0.");
    }

    /// <summary>How many are left; a negative number is stored as 0.</summary>
    public int Stock
    {
        get;
        set => field = Math.Max(0, value);
    }
}

public class VendingMachine
{
    private readonly Slot?[] slots;

    public VendingMachine(int size) => slots = new Slot?[size];

    /// <summary>The money inserted and not yet spent.</summary>
    public decimal Credit { get; private set; }

    /// <summary>Adds a coin of 0.10, 0.20, 0.50, 1 or 2 to the credit.</summary>
    public void Insert(decimal coin)
    {
        if (coin != 0.10m && coin != 0.20m && coin != 0.50m && coin != 1m && coin != 2m)
        {
            throw new ArgumentException($"The machine does not take {coin}.", nameof(coin));
        }
        Credit += coin;
    }

    /// <summary>Hands back the whole credit.</summary>
    public decimal Refund()
    {
        decimal back = Credit;
        Credit = 0;
        return back;
    }

    /// <summary>The slot with this number, counting from 1; null when it is empty.</summary>
    public Slot? this[int number]
    {
        get => slots[IndexOf(number)];
        set => slots[IndexOf(number)] = value;
    }

    /// <summary>Adds to the stock of a slot; an empty slot is skipped.</summary>
    public void Restock(int number, int amount) => this[number]?.Stock += amount;

    /// <summary>The array index of a slot number, after checking that the slot exists.</summary>
    private int IndexOf(int number)
    {
        if (number < 1 || number > slots.Length) throw new ArgumentOutOfRangeException(nameof(number));
        return number - 1;
    }
}
