// Radio Playlist
//
// A duration with an explicit conversion that checks its input, an implicit
// one that cannot fail, and a + operator; a track code with value equality
// that all five equality members agree on; and a playlist that grows in place
// with a C# 14 instance += operator.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// A length of time in whole seconds, never negative.
public readonly record struct Duration
{
    private Duration(int seconds) => Seconds = seconds;

    public int Seconds { get; }

    public override string ToString() => $"{Seconds / 60}:{Seconds % 60:00}";

    // TODO 1: can fail, so it is explicit
    public static explicit operator Duration(int seconds) => throw new NotImplementedException();

    // TODO 1: always works and loses nothing, so it is implicit
    public static implicit operator TimeSpan(Duration duration) => throw new NotImplementedException();

    // TODO 1
    public static Duration operator +(Duration left, Duration right) => throw new NotImplementedException();
}

/// A catalogue code such as "AB-12", however it was typed.
public sealed class TrackCode(string code) : IEquatable<TrackCode>
{
    public string Code { get; } = code.Trim().ToUpperInvariant();

    public override string ToString() => Code;

    // TODO 2: equality based on Code, the same in all five members
    public bool Equals(TrackCode? other) => throw new NotImplementedException();

    public override bool Equals(object? obj) => throw new NotImplementedException();

    public override int GetHashCode() => throw new NotImplementedException();

    public static bool operator ==(TrackCode? left, TrackCode? right) => throw new NotImplementedException();

    public static bool operator !=(TrackCode? left, TrackCode? right) => throw new NotImplementedException();
}

/// The tracks of one show, counted and timed.
public sealed class Playlist(string show)
{
    public string Show { get; } = show;

    public int Count { get; private set; }

    public Duration Length { get; private set; }

    /// Adds one track to this playlist, in place.
    public void operator +=(Duration track)
    {
        // TODO 3
        throw new NotImplementedException();
    }
}
