// Climbing Card
//
// One class for a bouldering gym's visit cards. Keep every public name,
// parameter and type exactly as it is: the tests use them. You may add
// private fields and private methods.

public class VisitCard
{
    private static int s_issued = 0;
    private int _visitsLeft;

    public VisitCard(string owner, int visits)
    {
        s_issued++;
        Number = s_issued;
        Owner = owner;
        _visitsLeft = visits;
    }

    // How many cards have been created so far.
    public static int Issued => s_issued;

    // 1 for the first card created, 2 for the next one, and so on.
    public int Number { get; }

    public string Owner { get; }

    // The climber's locker. This property is complete.
    public string Locker { get; set; } = "none";

    public int VisitsLeft => _visitsLeft;

    // Takes one visit off the card; false and no change when none is left.
    public bool CheckIn()
    {
        if (_visitsLeft == 0)
        {
            return false;
        }
        _visitsLeft--;
        return true;
    }

    public void TopUp(int visits)
    {
        _visitsLeft += visits;
    }

    // For example "Card 1, Ada: 4 visits left, locker B7".
    public string Describe()
    {
        string word = _visitsLeft == 1 ? "visit" : "visits";
        return $"Card {Number}, {Owner}: {_visitsLeft} {word} left, locker {Locker}";
    }
}
