// Step Counter
//
// The tests call the four methods below. Each one declares its result
// variable first: write only where a comment says YOUR CODE, and keep the
// last line, which hands the result back to the tests.
//
// days holds the steps of each day in order. days[0] is day 1.

static class StepCounter
{
    // The sum of the steps of every day.
    public static int Total(int[] days)
    {
        int total = 0;
        // YOUR CODE (task 1): add up the days.

        return total;
    }

    // The number of the day with the most steps, the earliest on a tie.
    public static int BestDay(int[] days)
    {
        int bestDay = 0;
        // YOUR CODE (task 2): find the day.

        return bestDay;
    }

    // The number of the day on which the running total first reaches goal,
    // or 0 when it never does.
    public static int GoalReachedOn(int[] days, int goal)
    {
        int reachedOn = 0;
        // YOUR CODE (task 3): keep a running total and stop once it is reached.

        return reachedOn;
    }

    // How many weeks of 500 extra steps it takes until dailyGoal is at least target.
    public static int WeeksToTarget(int dailyGoal, int target)
    {
        int weeks = 0;
        // YOUR CODE (task 4): repeat while the goal is still below the target.

        return weeks;
    }
}
