// Egg Packing
//
// The tests call the four methods below.

static class EggFarm
{
    // How many cartons of 12 the eggs fill completely.
    public static int FullCartons(int eggs)
    {
        int cartons = eggs / 12;

        return cartons;
    }

    // How many eggs are left over once every full carton is packed.
    public static int LooseEggs(int eggs)
    {
        int loose = eggs % 12;

        return loose;
    }

    // The average weight of one egg, with its fractional part.
    public static double AverageGrams(int totalGrams, int eggs)
    {
        double average = (double)totalGrams / eggs;

        return average;
    }

    // The number written on a picker's note, or 0 when it is not a whole number.
    public static int CountFromNote(string note)
    {
        // TryParse sets count to 0 when the note is not a whole number.
        int.TryParse(note, out int count);

        return count;
    }
}
