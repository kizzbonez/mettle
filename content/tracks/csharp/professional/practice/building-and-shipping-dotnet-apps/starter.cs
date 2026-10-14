// Lowest Applicable
//
// A dependency report for a build server: it reads the PackageReference items
// of a project file, parses their NuGet version ranges, and picks the version
// NuGet would choose from a feed, which is the lowest one every range allows.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

using System.Xml.Linq;

/// <summary>A NuGet version range. A bound that is null is missing, and its Inclusive flag is false.</summary>
public sealed record VersionRange(Version? Min, bool MinInclusive, Version? Max, bool MaxInclusive)
{
    /// <summary>Parses "1.4.2", "[1.4.2]", "[1.0,2.0)", "(,2.0]" and the other bracket forms.</summary>
    public static VersionRange Parse(string text)
    {
        throw new NotImplementedException();
    }

    /// <summary>Whether the range allows <paramref name="version"/>.</summary>
    public bool Includes(Version version)
    {
        throw new NotImplementedException();
    }
}

public static class NuGet
{
    /// <summary>Reads "1.4" or "1.4.2" as a three-part version: 1.4.0 or 1.4.2. Written for you.</summary>
    public static Version ParseVersion(string text)
    {
        if (!Version.TryParse(text.Trim(), out Version? version) || version.Revision >= 0)
            throw new FormatException($"\"{text}\" is not a version of two or three numbers");
        return new Version(version.Major, version.Minor, Math.Max(version.Build, 0));
    }

    /// <summary>The lowest available version that every range allows, or null if there is none.</summary>
    public static Version? PickLowest(IEnumerable<Version> available, IEnumerable<VersionRange> ranges)
    {
        throw new NotImplementedException();
    }

    /// <summary>The PackageReference items of a project file, in document order.</summary>
    public static IReadOnlyList<(string Id, VersionRange? Range)> PackageReferences(string projectXml)
    {
        throw new NotImplementedException();
    }
}
