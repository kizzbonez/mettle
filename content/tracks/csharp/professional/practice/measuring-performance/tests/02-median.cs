// Odd numbers of samples: the middle one.
Check.Equal(Measure.Median([7]), 7.0, "the median of a single sample");
Check.Equal(Measure.Median([3, 1, 2]), 2.0, "the median of three samples out of order");
Check.Equal(Measure.Median([9, 1, 9, 1, 5]), 5.0, "the median of five samples with repeated values");
Check.Equal(Measure.Median([40, 41, 4000]), 41.0, "one slow outlier does not move the median");
Check.Equal(Measure.Median(Enumerable.Range(1, 1001).Reverse().Select(n => (long)n).ToList()), 501.0,
    "the median of 1,001 samples in decreasing order");

// Even numbers of samples: the mean of the two middle ones.
Check.Equal(Measure.Median([10, 20]), 15.0, "the median of two samples");
Check.Equal(Measure.Median([2, 1]), 1.5, "the median of two samples whose mean is not a whole number");
Check.Equal(Measure.Median([4, 4, 4, 9]), 4.0, "the median of four samples whose two middle values are equal");
Check.Equal(Measure.Median([8, 100, 2, 6, 50, 4]), 7.0, "the median of six samples out of order");
Check.Equal(Measure.Median([long.MaxValue, long.MaxValue]), (double)long.MaxValue,
    "the median of two samples near the top of the range of a long");

// The input stays as it was.
long[] taken = [5, 3, 9, 1];
Check.Equal(Measure.Median(taken), 4.0, "the median of 5, 3, 9 and 1");
Check.SequenceEqual(taken, [5L, 3L, 9L, 1L], "the caller's array keeps its order after Median");
var list = new List<long> { 30, 10, 20 };
Check.Equal(Measure.Median(list), 20.0, "the median of a list");
Check.SequenceEqual(list, [30L, 10L, 20L], "the caller's list keeps its order after Median");

Check.Throws<ArgumentException>(() => Measure.Median([]), "the median of no samples");
Check.Throws<ArgumentException>(() => Measure.Median(new List<long>()), "the median of an empty list");
