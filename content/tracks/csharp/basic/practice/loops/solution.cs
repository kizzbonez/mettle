// Step Counter
//
// The tests call the four methods below.
//
// days holds the steps of each day in order. days[0] is day 1.

static class StepCounter
{
    // The sum of the steps of every day.
    public static int Total(int[] days)
    {
        int total = 0;
        foreach (int steps in days)
        {
            total += steps;
        }

        return total;
    }

    // The number of the day with the most steps, the earliest on a tie.
    public static int BestDay(int[] days)
    {
        int bestDay = 0;
        int best = 0;
        for (int i = 1; i < days.Length; i++)
        {
            if (days[i] > days[best])
            {
                best = i;
            }
        }
        bestDay = best + 1;

        return bestDay;
    }

    // The number of the day on which the running total first reaches goal,
    // or 0 when it never does.
    public static int GoalReachedOn(int[] days, int goal)
    {
        int reachedOn = 0;
        int runningTotal = 0;
        for (int i = 0; i < days.Length; i++)
        {
            runningTotal += days[i];
            if (runningTotal >= goal)
            {
                reachedOn = i + 1;
                break;
            }
        }

        return reachedOn;
    }

    // How many weeks of 500 extra steps it takes until dailyGoal is at least target.
    public static int WeeksToTarget(int dailyGoal, int target)
    {
        int weeks = 0;
        while (dailyGoal < target)
        {
            dailyGoal += 500;
            weeks++;
        }

        return weeks;
    }
}
