// Lowest Applicable
//
// A dependency report for a build server: it reads the PackageReference items
// of a project file, parses their NuGet version ranges, and picks the version
// NuGet would choose from a feed, which is the lowest one every range allows.

using System.Xml.Linq;

/// <summary>A NuGet version range. A bound that is null is missing, and its Inclusive flag is false.</summary>
public sealed record VersionRange(Version? Min, bool MinInclusive, Version? Max, bool MaxInclusive)
{
    /// <summary>Parses "1.4.2", "[1.4.2]", "[1.0,2.0)", "(,2.0]" and the other bracket forms.</summary>
    public static VersionRange Parse(string text)
    {
        string range = text.Trim();
        if (range.Length == 0) throw new FormatException("a version range cannot be empty");

        // A bare version is a lower bound: that version or higher.
        if (range[0] is not ('[' or '('))
            return new VersionRange(NuGet.ParseVersion(range), true, null, false);

        if (range[^1] is not (']' or ')'))
            throw new FormatException($"\"{text}\" opens a bracket and does not close one");
        bool minInclusive = range[0] == '[';
        bool maxInclusive = range[^1] == ']';
        string[] parts = range[1..^1].Split(',');

        if (parts.Length == 1)
        {
            // [1.4.2] is exactly one version; with a round bracket it would allow none.
            if (!minInclusive || !maxInclusive)
                throw new FormatException($"\"{text}\" is a single version, which needs square brackets");
            Version exact = NuGet.ParseVersion(parts[0]);
            return new VersionRange(exact, true, exact, true);
        }
        if (parts.Length != 2) throw new FormatException($"\"{text}\" has more than two bounds");

        Version? min = string.IsNullOrWhiteSpace(parts[0]) ? null : NuGet.ParseVersion(parts[0]);
        Version? max = string.IsNullOrWhiteSpace(parts[1]) ? null : NuGet.ParseVersion(parts[1]);
        if (min is null && max is null) throw new FormatException($"\"{text}\" has no bound at all");
        if (min is not null && max is not null && (min > max || (min == max && !(minInclusive && maxInclusive))))
            throw new FormatException($"\"{text}\" allows no version");

        return new VersionRange(min, min is not null && minInclusive, max, max is not null && maxInclusive);
    }

    /// <summary>Whether the range allows <paramref name="version"/>.</summary>
    public bool Includes(Version version) =>
        (Min is null || (MinInclusive ? version >= Min : version > Min))
        && (Max is null || (MaxInclusive ? version <= Max : version < Max));
}

public static class NuGet
{
    /// <summary>Reads "1.4" or "1.4.2" as a three-part version: 1.4.0 or 1.4.2.</summary>
    public static Version ParseVersion(string text)
    {
        if (!Version.TryParse(text.Trim(), out Version? version) || version.Revision >= 0)
            throw new FormatException($"\"{text}\" is not a version of two or three numbers");
        return new Version(version.Major, version.Minor, Math.Max(version.Build, 0));
    }

    /// <summary>The lowest available version that every range allows, or null if there is none.</summary>
    public static Version? PickLowest(IEnumerable<Version> available, IEnumerable<VersionRange> ranges) =>
        available.Where(version => ranges.All(range => range.Includes(version))).Order().FirstOrDefault();

    /// <summary>The PackageReference items of a project file, in document order.</summary>
    public static IReadOnlyList<(string Id, VersionRange? Range)> PackageReferences(string projectXml)
    {
        XDocument project = XDocument.Parse(projectXml);
        var references = new List<(string Id, VersionRange? Range)>();

        // By local name: old project files put every element in the MSBuild namespace.
        foreach (XElement item in project.Descendants().Where(element => element.Name.LocalName == "PackageReference"))
        {
            string? id = (string?)item.Attribute("Include");
            if (id is null) continue;   // an Update item changes a reference made elsewhere

            string? version = (string?)item.Attribute("Version")
                ?? item.Elements().FirstOrDefault(child => child.Name.LocalName == "Version")?.Value;
            // No version: Central Package Management supplies it from Directory.Packages.props.
            references.Add((id, version is null ? null : VersionRange.Parse(version)));
        }
        return references;
    }
}
