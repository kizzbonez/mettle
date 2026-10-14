Check.True(StepCounter.WeeksToTarget(8000, 8000) == 0, "a daily goal that already equals the target needs no weeks");
Check.True(StepCounter.WeeksToTarget(10000, 8000) == 0, "a daily goal above the target needs no weeks");
Check.True(StepCounter.WeeksToTarget(7999, 8000) == 1, "a daily goal just below the target needs one week");
Check.True(StepCounter.WeeksToTarget(7500, 8000) == 1, "a daily goal exactly 500 below the target needs one week");
Check.True(StepCounter.WeeksToTarget(6000, 8001) == 5, "a target just past a week's step needs one more week");
Check.True(StepCounter.WeeksToTarget(0, 10000) == 20, "a daily goal that starts at 0");
