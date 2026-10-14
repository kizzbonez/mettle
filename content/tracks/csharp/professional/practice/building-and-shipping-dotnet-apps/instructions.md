`NuGet.ParseVersion` is written: it reads `1.4` or `1.4.2` as a three-part `Version` (`1.4.0`,
`1.4.2`) and throws `FormatException` for anything else. Versions in this lab have no
pre-release suffix. Write the four other members.

1. `static VersionRange Parse(string text)` reads a NuGet version range. Whitespace around the
   text and around each bound is ignored. Read every version with `NuGet.ParseVersion`.

   | Text         | Meaning                     | Min     | MinInclusive | Max     | MaxInclusive |
   | ------------ | --------------------------- | ------- | ------------ | ------- | ------------ |
   | `1.4.2`      | 1.4.2 or higher             | `1.4.2` | true         | null    | false        |
   | `[1.4.2]`    | exactly 1.4.2               | `1.4.2` | true         | `1.4.2` | true         |
   | `[1.0,2.0)`  | at least 1.0, below 2.0     | `1.0.0` | true         | `2.0.0` | false        |
   | `(1.0,2.0]`  | above 1.0, at most 2.0      | `1.0.0` | false        | `2.0.0` | true         |
   | `[1.0,)`     | at least 1.0                | `1.0.0` | true         | null    | false        |
   | `(,2.0)`     | below 2.0                   | null    | false        | `2.0.0` | false        |

   `[` and `]` include the bound, `(` and `)` exclude it, and a missing bound is null with its
   flag `false`. Throw `FormatException` for: empty text; a bracket that is opened and not
   closed; a single version in round brackets, such as `(1.0)`; more than two bounds; no bound
   at all, as in `(,)`; and a range that allows no version, where `Min` is above `Max`, or
   equal to it without both brackets square.
2. `bool Includes(Version version)` says whether the range allows `version`.
3. `static Version? PickLowest(IEnumerable<Version> available, IEnumerable<VersionRange> ranges)`
   returns what NuGet resolves to: the **lowest** available version that **every** range
   includes, or `null` if none does. `available` may be in any order.
4. `static IReadOnlyList<(string Id, VersionRange? Range)> PackageReferences(string projectXml)`
   reads the `PackageReference` items of a project file, in document order, from any
   `ItemGroup`.
   - The id is the `Include` attribute. An item with `Update` instead of `Include` changes a
     reference made elsewhere: skip it. Other items, such as `ProjectReference`, are ignored.
   - The version is the `Version` attribute or, if there is none, a `<Version>` child element.
   - An item with no version at all gets the range `null`: under Central Package Management
     its version lives in `Directory.Packages.props`.
   - Older project files put every element in the MSBuild namespace
     (`xmlns="http://schemas.microsoft.com/developer/msbuild/2003"`). Match elements by their
     local name so that both kinds work.

Example, the lesson's practice question:

```csharp
Version[] feed = [NuGet.ParseVersion("4.0.9"), NuGet.ParseVersion("4.1.0"),
                  NuGet.ParseVersion("4.3.2"), NuGet.ParseVersion("5.0.0")];

NuGet.PickLowest(feed, [VersionRange.Parse("4.1.0")])                                // 4.1.0
NuGet.PickLowest(feed, [VersionRange.Parse("4.1.0"), VersionRange.Parse("[4.2,5.0)")])   // 4.3.2
NuGet.PickLowest(feed, [VersionRange.Parse("[5.1,)")])                               // null

VersionRange.Parse("[1.0,2.0)")                  // { Min = 1.0.0, MinInclusive = True, Max = 2.0.0, MaxInclusive = False }
VersionRange.Parse("[1.0,2.0)").Includes(NuGet.ParseVersion("2.0"))   // false

NuGet.PackageReferences("""
    <Project Sdk="Microsoft.NET.Sdk">
      <ItemGroup>
        <PackageReference Include="Contoso.Json" Version="4.1.0" />
        <PackageReference Include="Contoso.Http" />
        <ProjectReference Include="..\Billing.Core\Billing.Core.csproj" />
      </ItemGroup>
    </Project>
    """)
// [("Contoso.Json", 4.1.0 or higher), ("Contoso.Http", null)]
```

**Tips**

- `Version` has `<`, `<=`, `>` and `>=`, and `Order()` sorts versions.
- `XDocument.Parse(text).Descendants()` visits every element. `element.Name.LocalName` is the
  name without its namespace, and `(string?)element.Attribute("Include")` is null when the
  attribute is missing. `using System.Xml.Linq;` is already in the starter.
- `range[1..^1]` is the text between the brackets.
