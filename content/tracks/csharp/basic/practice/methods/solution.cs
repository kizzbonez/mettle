// Laundromat
//
// Four methods for the screen by the door. Keep every signature exactly as
// it is: the tests call these methods by name, with these parameters.

static class Laundromat
{
    // How many washers of `capacity` kilograms the laundry needs.
    public static int WashersNeeded(int kilos, int capacity = 8)
    {
        int washers = kilos / capacity;
        if (kilos % capacity != 0)
        {
            washers++;
        }
        return washers;
    }

    // 4.50 per washer, plus 2.00 per washer when the laundry is also dried.
    public static decimal Price(int washers, bool dry = false) => washers * (dry ? 6.50m : 4.50m);

    // Reads what a customer typed: true and the number when it is a whole
    // number of 1 or more, otherwise false and 0.
    public static bool TryReadKilos(string text, out int kilos)
    {
        if (int.TryParse(text, out kilos) && kilos >= 1)
        {
            return true;
        }
        kilos = 0;
        return false;
    }

    // Pays cost from the caller's balance when it is enough.
    public static bool PayWithCard(ref decimal balance, decimal cost)
    {
        if (balance < cost)
        {
            return false;
        }
        balance -= cost;
        return true;
    }
}
