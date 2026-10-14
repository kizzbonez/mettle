The tests call the four methods of the class `StepCounter`. Write only where a comment says
`YOUR CODE`, and keep the `return ...;` line at the end of each method. Three methods receive
`int[] days`, an array with the steps of each day in order, like the `laps` array in the lesson:
`days.Length` is the number of days and `days[0]` is the first day. People number days from 1,
so `days[0]` is day 1.

1. `Total(int[] days)` is the sum of all the steps. An empty array totals `0`.
2. `BestDay(int[] days)` is the number of the day with the most steps. When several days share
   the highest count, it is the earliest of them. The array always holds at least one day.
3. `GoalReachedOn(int[] days, int goal)` adds the days up in order and returns the number of
   the day on which the running total first reaches `goal` or more. Stop looking as soon as you
   know the answer. When the total never reaches `goal`, return `0`.
4. `WeeksToTarget(int dailyGoal, int target)`: each week, the daily goal goes up by 500 steps.
   Return how many weeks it takes until the daily goal is at least `target`. When it already
   is, the answer is `0`.

Example:

```csharp
int[] days = [4200, 9800, 12000, 7600];
StepCounter.Total(days)                  // 33600
StepCounter.BestDay(days)                // 3
StepCounter.GoalReachedOn(days, 20000)   // 3, because 4200 + 9800 + 12000 is the first total of 20000 or more
StepCounter.GoalReachedOn(days, 50000)   // 0
StepCounter.WeeksToTarget(6000, 8000)    // 4: 6500, 7000, 7500, 8000
```

**Tip:** `GoalReachedOn` and `BestDay` need the position of a day, so they suit a `for` loop.
`WeeksToTarget` does not know in advance how many weeks it needs, which suits `while`.
