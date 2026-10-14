// Departure Board
//
// Each method below is a small program of its own, like the lesson's
// hello.cs. The tests call the methods and read what they print.
//
// "public static" in front of each method lets the tests call it. Leave it
// where it is, and write only where a comment says YOUR CODE.

static class FerryBoard
{
    // Prints the welcome line.
    public static void Welcome()
    {
        // YOUR CODE (task 1): this still prints the lesson's text. Change it
        // so that the line reads: Welcome to Harbour Quay!
        Console.WriteLine("Hello, World!");
    }

    // Prints the morning's sailings, one per line.
    public static void Sailings()
    {
        // YOUR CODE (task 2): print these two lines, in this order.
        //     07:45 Gull Island
        //     09:30 Little Skerry
        // The next line is a note for the staff. Turn it into a comment, so
        // that it stays in the file but is no longer printed.
        Console.WriteLine("Staff: check the 09:30 times with the captain");
    }

    // Prints the label that goes in front of a gate number.
    public static void GateLabel()
    {
        // YOUR CODE (task 3): print "Board at gate " with one space at the
        // end, and do not end the line.
    }
}
