// A source that counts how many readings were taken from it, and notes when it
// is closed (its finally block runs when its enumerator is disposed).
int pulls = 0;
int closed = 0;
IEnumerable<int?> Sensor(params int?[] values)
{
    try
    {
        foreach (int? value in values)
        {
            pulls++;
            yield return value;
        }
    }
    finally
    {
        closed++;
    }
}

// Nothing is read before the caller starts.
IEnumerable<int> readings = Station.UntilGap(Sensor(4, 3, null, 5, 6));
Check.Equal(pulls, 0, "no reading is taken from the source until the result is enumerated");

// Up to the gap, and not one reading further.
Check.SequenceEqual(readings.ToList(), [4, 3], "the readings before the first gap");
Check.Equal(pulls, 3, "the source is read up to the gap and no further");
Check.Equal(closed, 1, "the source is closed when the gap is reached");

// One reading for each item the caller asks for.
pulls = 0;
closed = 0;
using (IEnumerator<int> reader = Station.UntilGap(Sensor(1, 2, 3, 4, 5)).GetEnumerator())
{
    reader.MoveNext();
    reader.MoveNext();
    Check.Equal(reader.Current, 2, "the second reading");
    Check.Equal(pulls, 2, "the source is read one reading at a time, as the caller asks");
}
Check.Equal(closed, 1, "a caller that stops early still closes the source");

// The caller stops early through LINQ.
pulls = 0;
closed = 0;
Check.SequenceEqual(Station.UntilGap(Sensor(9, 8, 7, 6)).Take(1), [9], "the first reading only");
Check.Equal(pulls, 1, "a caller that wants one reading takes one from the source");
Check.Equal(closed, 1, "Take closes the source once it has what it wants");

// Zero and negative temperatures are readings, not gaps.
Check.SequenceEqual(Station.UntilGap(Sensor(0, -2, -7, null)), [0, -2, -7], "zero and negative readings are kept");

// No gap, a gap at once, and nothing at all.
Check.SequenceEqual(Station.UntilGap(Sensor(1, 2, 3)), [1, 2, 3], "every reading when there is no gap");
Check.Equal(Station.UntilGap(Sensor(null, 1, 2)).Count(), 0, "a gap at the start gives no readings");
Check.Equal(Station.UntilGap(Sensor()).Count(), 0, "an empty source gives no readings");

// Each enumeration reads the source again.
pulls = 0;
IEnumerable<int> twice = Station.UntilGap(Sensor(5, null));
twice.ToList();
twice.ToList();
Check.Equal(pulls, 4, "enumerating the result twice reads the source twice");
