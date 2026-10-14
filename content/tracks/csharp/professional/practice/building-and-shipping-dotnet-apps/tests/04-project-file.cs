static Version V(string text) => NuGet.ParseVersion(text);
static VersionRange R(string text) => VersionRange.Parse(text);

// An SDK-style project with two item groups, a child Version element, an
// Update item, a reference without a version and a project reference.
var modern = NuGet.PackageReferences("""
    <Project Sdk="Microsoft.NET.Sdk">
      <PropertyGroup>
        <TargetFramework>net10.0</TargetFramework>
        <Version>2.4.1</Version>
      </PropertyGroup>
      <ItemGroup>
        <PackageReference Include="Microsoft.Extensions.Hosting" Version="10.0.0" />
        <PackageReference Include="Contoso.Json">
          <Version>[4.2,5.0)</Version>
          <PrivateAssets>all</PrivateAssets>
        </PackageReference>
        <ProjectReference Include="..\Billing.Core\Billing.Core.csproj" />
      </ItemGroup>
      <ItemGroup Condition="'$(Configuration)' == 'Debug'">
        <PackageReference Update="Microsoft.Extensions.Hosting" Version="10.0.1" />
        <PackageReference Include="Contoso.Diagnostics" />
        <PackageReference Include="Contoso.Http" Version=" (,4.2] " />
      </ItemGroup>
    </Project>
    """);
Check.SequenceEqual(modern,
[
    ("Microsoft.Extensions.Hosting", R("10.0.0")),
    ("Contoso.Json", R("[4.2,5.0)")),
    ("Contoso.Diagnostics", (VersionRange?)null),
    ("Contoso.Http", R("(,4.2]")),
],
    "the package references of an SDK-style project with two item groups, in document order");

// An old project file, with every element in the MSBuild namespace.
var old = NuGet.PackageReferences("""
    <?xml version="1.0" encoding="utf-8"?>
    <Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
      <ItemGroup>
        <Reference Include="System.Xml" />
        <PackageReference Include="Newtonsoft.Json">
          <Version>13.0.3</Version>
        </PackageReference>
        <PackageReference Include="Serilog" Version="[3.1.1]" />
      </ItemGroup>
    </Project>
    """);
Check.SequenceEqual(old, [("Newtonsoft.Json", R("13.0.3")), ("Serilog", R("[3.1.1]"))],
    "the package references of a project file in the MSBuild namespace");

// Nothing to report.
Check.SequenceEqual(NuGet.PackageReferences("<Project Sdk=\"Microsoft.NET.Sdk\" />"), [],
    "the package references of a project with none");
Check.SequenceEqual(NuGet.PackageReferences("""
    <Project>
      <ItemGroup>
        <PackageReference Update="Contoso.Json" Version="4.3.2" />
      </ItemGroup>
    </Project>
    """), [], "a project whose only package item is an Update");

// A version that is not a range.
Check.Throws<FormatException>(() => NuGet.PackageReferences("""
    <Project>
      <ItemGroup>
        <PackageReference Include="Contoso.Json" Version="[4.2,5.0" />
      </ItemGroup>
    </Project>
    """), "a package reference whose version is not a valid range");

// The report: the version each reference resolves to from a feed.
Version[] feed = [V("9.0.0"), V("10.0.0"), V("10.0.2"), V("4.1.0"), V("4.3.2"), V("5.0.0")];
var picked = modern.Where(reference => reference.Range is not null)
    .Select(reference => (reference.Id, NuGet.PickLowest(feed, [reference.Range!])))
    .ToList();
Check.SequenceEqual(picked,
[
    ("Microsoft.Extensions.Hosting", (Version?)V("10.0.0")),
    ("Contoso.Json", V("4.3.2")),
    ("Contoso.Http", V("4.1.0")),
],
    "the version picked for each package reference of the SDK-style project");
