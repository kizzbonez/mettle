// The example from the instructions: the lesson's practice question.
static Version V(string text) => NuGet.ParseVersion(text);

Version[] feed = [V("4.0.9"), V("4.1.0"), V("4.3.2"), V("5.0.0")];
Check.Equal(NuGet.PickLowest(feed, [VersionRange.Parse("4.1.0")]), V("4.1.0"),
    "the version picked for Version=\"4.1.0\"");
Check.Equal(NuGet.PickLowest(feed, [VersionRange.Parse("4.1.0"), VersionRange.Parse("[4.2,5.0)")]), V("4.3.2"),
    "the version picked when a dependency also asks for [4.2,5.0)");
Check.Equal(NuGet.PickLowest(feed, [VersionRange.Parse("[5.1,)")]), null, "the version picked when nothing in the feed fits");

Check.Equal(VersionRange.Parse("[1.0,2.0)"), new VersionRange(V("1.0"), true, V("2.0"), false), "the range [1.0,2.0)");
Check.True(!VersionRange.Parse("[1.0,2.0)").Includes(V("2.0")), "[1.0,2.0) does not include 2.0");

var references = NuGet.PackageReferences("""
    <Project Sdk="Microsoft.NET.Sdk">
      <ItemGroup>
        <PackageReference Include="Contoso.Json" Version="4.1.0" />
        <PackageReference Include="Contoso.Http" />
        <ProjectReference Include="..\Billing.Core\Billing.Core.csproj" />
      </ItemGroup>
    </Project>
    """);
Check.SequenceEqual(references, [("Contoso.Json", new VersionRange(V("4.1.0"), true, null, false)), ("Contoso.Http", (VersionRange?)null)],
    "the package references of the example project");
