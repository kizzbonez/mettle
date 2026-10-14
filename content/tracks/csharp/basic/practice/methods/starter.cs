// Laundromat
//
// Four methods for the screen by the door. Keep every signature exactly as
// it is: the tests call these methods by name, with these parameters.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

static class Laundromat
{
    // How many washers of `capacity` kilograms the laundry needs.
    public static int WashersNeeded(int kilos, int capacity = 8)
    {
        throw new NotImplementedException();
    }

    // 4.50 per washer, plus 2.00 per washer when the laundry is also dried.
    public static decimal Price(int washers, bool dry = false)
    {
        throw new NotImplementedException();
    }

    // Reads what a customer typed: true and the number when it is a whole
    // number of 1 or more, otherwise false and 0.
    public static bool TryReadKilos(string text, out int kilos)
    {
        throw new NotImplementedException();
    }

    // Pays cost from the caller's balance when it is enough.
    public static bool PayWithCard(ref decimal balance, decimal cost)
    {
        throw new NotImplementedException();
    }
}
