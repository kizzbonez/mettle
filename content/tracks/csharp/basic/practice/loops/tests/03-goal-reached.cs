int[] days = [3000, 3000, 3000, 3000];
Check.True(StepCounter.GoalReachedOn(days, 2000) == 1, "a goal that the first day reaches on its own");
Check.True(StepCounter.GoalReachedOn(days, 6000) == 2, "a running total that equals the goal exactly has reached it");
Check.True(StepCounter.GoalReachedOn(days, 6001) == 3, "a running total one step short of the goal has not reached it");
Check.True(StepCounter.GoalReachedOn(days, 12000) == 4, "a goal that only the last day completes");
Check.True(StepCounter.GoalReachedOn(days, 12001) == 0, "a goal that is never reached gives 0");
Check.True(StepCounter.GoalReachedOn([], 1) == 0, "an empty array never reaches a goal");
Check.True(StepCounter.GoalReachedOn([500, 9000, 9000, 9000], 9500) == 2,
    "the answer is the first day that reaches the goal, not a later one");
