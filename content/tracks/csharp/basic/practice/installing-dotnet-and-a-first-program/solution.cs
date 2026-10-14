// Departure Board
//
// Each method below is a small program of its own, like the lesson's
// hello.cs. The tests call the methods and read what they print.

static class FerryBoard
{
    // Prints the welcome line.
    public static void Welcome()
    {
        Console.WriteLine("Welcome to Harbour Quay!");
    }

    // Prints the morning's sailings, one per line.
    public static void Sailings()
    {
        Console.WriteLine("07:45 Gull Island");
        Console.WriteLine("09:30 Little Skerry");
        // Console.WriteLine("Staff: check the 09:30 times with the captain");
    }

    // Prints the label that goes in front of a gate number.
    public static void GateLabel()
    {
        Console.Write("Board at gate ");
    }
}
