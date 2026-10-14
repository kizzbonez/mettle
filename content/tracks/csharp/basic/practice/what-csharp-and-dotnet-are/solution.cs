// Honey Harvest
//
// This file holds a program like the first one in the lesson. In the lesson
// the statements stand on their own in the file. Here they sit inside a
// method named Report, in a class named Honey, because the tests call
// Report and read what it prints. Lessons 8 and 11 explain these wrappers,
// so leave every line outside the YOUR CODE line as it is.

static class Honey
{
    public static void Report()
    {
        double[] hives = [3.5, 4.25, 2.0, 2.75];

        double total = 0;
        foreach (double hive in hives)
        {
            total += hive;
        }
        Console.WriteLine($"{hives.Length} hives gave {total} kg of honey");
    }
}
