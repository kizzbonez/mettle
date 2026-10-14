// Radio Playlist
//
// A duration with an explicit conversion that checks its input, an implicit
// one that cannot fail, and a + operator; a track code with value equality
// that all five equality members agree on; and a playlist that grows in place
// with a C# 14 instance += operator.

/// A length of time in whole seconds, never negative.
public readonly record struct Duration
{
    private Duration(int seconds) => Seconds = seconds;

    public int Seconds { get; }

    public override string ToString() => $"{Seconds / 60}:{Seconds % 60:00}";

    // Not every int is a valid duration, so the cast is explicit and checks.
    public static explicit operator Duration(int seconds)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(seconds);
        return new Duration(seconds);
    }

    // Every duration is a valid TimeSpan, so no cast is needed.
    public static implicit operator TimeSpan(Duration duration) => TimeSpan.FromSeconds(duration.Seconds);

    public static Duration operator +(Duration left, Duration right) => new(left.Seconds + right.Seconds);
}

/// A catalogue code such as "AB-12", however it was typed.
public sealed class TrackCode(string code) : IEquatable<TrackCode>
{
    public string Code { get; } = code.Trim().ToUpperInvariant();

    public override string ToString() => Code;

    // Everything funnels into this one method.
    public bool Equals(TrackCode? other) => other is not null && Code == other.Code;

    public override bool Equals(object? obj) => Equals(obj as TrackCode);

    public override int GetHashCode() => Code.GetHashCode();

    public static bool operator ==(TrackCode? left, TrackCode? right) =>
        left is null ? right is null : left.Equals(right);

    public static bool operator !=(TrackCode? left, TrackCode? right) => !(left == right);
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
        Count++;
        Length += track;
    }
}
