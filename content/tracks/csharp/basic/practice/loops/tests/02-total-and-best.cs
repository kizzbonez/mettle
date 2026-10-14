Check.True(StepCounter.Total([]) == 0, "an empty array of days totals 0");
Check.True(StepCounter.Total([5000]) == 5000, "the total of a single day is that day");
Check.True(StepCounter.Total([0, 0, 0]) == 0, "days without steps add nothing");
Check.True(StepCounter.Total([1, 20, 300, 4000, 50000]) == 54321, "every day is added, the first and the last included");

Check.True(StepCounter.BestDay([7000]) == 1, "with a single day, day 1 is the best");
Check.True(StepCounter.BestDay([9000, 100, 200]) == 1, "the best day can be the first one");
Check.True(StepCounter.BestDay([100, 200, 9000]) == 3, "the best day can be the last one");
Check.True(StepCounter.BestDay([100, 8000, 300, 8000]) == 2, "when two days share the highest count, the earlier one is the answer");
Check.True(StepCounter.BestDay([0, 0, 0]) == 1, "when every day has the same count, the first day is the answer");
