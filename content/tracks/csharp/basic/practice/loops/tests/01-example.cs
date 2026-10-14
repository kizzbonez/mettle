// The example from the instructions: four days of steps, then a daily goal
// that grows from 6000 to 8000.
int[] days = [4200, 9800, 12000, 7600];
Check.Equal(StepCounter.Total(days), 33600, "the total of the four days");
Check.Equal(StepCounter.BestDay(days), 3, "the number of the day with the most steps");
Check.Equal(StepCounter.GoalReachedOn(days, 20000), 3, "the day on which the running total first reaches 20000");
Check.Equal(StepCounter.GoalReachedOn(days, 50000), 0, "the answer when the running total never reaches 50000");
Check.Equal(StepCounter.WeeksToTarget(6000, 8000), 4, "the weeks it takes to raise a daily goal of 6000 to 8000");
