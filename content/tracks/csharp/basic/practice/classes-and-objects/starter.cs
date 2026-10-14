// Climbing Card
//
// One class for a bouldering gym's visit cards. Keep every public name,
// parameter and type exactly as it is: the tests use them. You may add
// private fields and private methods.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public class VisitCard
{
    // YOUR CODE (task 1): add a private field for the visits left on this
    // card, and a private static field that counts the cards created so far.

    public VisitCard(string owner, int visits)
    {
        throw new NotImplementedException();
    }

    // How many cards have been created so far.
    public static int Issued => throw new NotImplementedException();

    // 1 for the first card created, 2 for the next one, and so on.
    public int Number { get; }

    public string Owner { get; }

    // The climber's locker. This property is complete.
    public string Locker { get; set; } = "none";

    public int VisitsLeft => throw new NotImplementedException();

    // Takes one visit off the card; false and no change when none is left.
    public bool CheckIn()
    {
        throw new NotImplementedException();
    }

    public void TopUp(int visits)
    {
        throw new NotImplementedException();
    }

    // For example "Card 1, Ada: 4 visits left, locker B7".
    public string Describe()
    {
        throw new NotImplementedException();
    }
}
