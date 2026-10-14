---
title: Building and Shipping .NET Apps
summary: Read and shape the project file, manage NuGet dependencies and versions, turn analyzer warnings into a quality gate, choose a publishing mode, and protect the software supply chain.
minutes: 30
objectives:
  - Read an SDK-style project file and share settings across projects with Directory.Build.props and Central Package Management
  - Interpret NuGet version ranges and apply semantic versioning to your own packages
  - Configure analyzers and warnings as errors, and explain the trade-off of each setting
  - Choose between framework-dependent, self-contained, single-file, trimmed and Native AOT publishing, and lock and audit dependencies
---

## Outline

1. The project file
2. NuGet and semantic versioning
3. Analyzers and warnings as errors
4. Stamping the version
5. Publishing
6. The software supply chain

## The project file

An **SDK-style project file** (`.csproj`) is a short MSBuild file. The SDK named at the top
supplies the defaults, so the file lists only what differs:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>   <!-- C# 14 is the default language here -->
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>       <!-- System, System.Linq, ... -->
    <Version>2.4.1</Version>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="10.0.0" />
    <ProjectReference Include="..\Billing.Core\Billing.Core.csproj" />
  </ItemGroup>
</Project>
```

**Properties** (inside `PropertyGroup`) are settings; **items** (inside `ItemGroup`) are lists of
inputs such as package and project references. In a repository with many projects, put shared
properties in a `Directory.Build.props` file at the root: MSBuild imports it into every project
below it. A `global.json` file pins the SDK version, so every developer and the build server
compile with the same tools.

## NuGet and semantic versioning

**NuGet** is .NET's package manager, and nuget.org its public registry. Package versions follow
**semantic versioning** (SemVer), `Major.Minor.Patch[-Suffix]`: a new major version may break
callers, a minor one adds features compatibly, a patch only fixes bugs, and a suffix such as
`-beta.2` marks a **pre-release**, which sorts before the release with the same number.

A version in a `PackageReference` is a **range**, not a pin. `Version="10.0.0"` means "10.0.0 or
higher", and NuGet resolves it to the **lowest** version that satisfies every requirement in the
graph. `[1.4.2]` is exact, `[1.0,2.0)` means at least 1.0 and below 2.0, and `6.*` floats to the
highest matching version. Microsoft advises against upper bounds on packages you do not own
unless you know of an incompatibility. When you publish your own library, the same rules bind
you: removing or changing any public member means a new major version.

With many projects, **Central Package Management** keeps every version in one file at the root,
and project files list packages without versions:

```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Microsoft.Extensions.Hosting" Version="10.0.0" />
    <PackageVersion Include="Microsoft.Extensions.Http" Version="10.0.0" />
  </ItemGroup>
</Project>
```

## Analyzers and warnings as errors

**Roslyn analyzers** are plug-ins that run inside the compiler and report problems as
diagnostics: **CA** rules for code quality (reliability, performance, security) and **IDE**
rules for style. The SDK enables a small set of CA rules by default for .NET 5 and later.
`<AnalysisMode>` (`Minimum`, `Recommended`, `All`) turns on more, `<EnforceCodeStyleInBuild>`
makes IDE rules run on the command line, and an `.editorconfig` file sets the severity of each
rule (`dotnet_diagnostic.CA2254.severity = error`). Third-party analyzer packages such as the
xUnit analyzers plug into the same mechanism.

A warning nobody is forced to read gets ignored, and a project with 400 warnings hides the one
that matters. `TreatWarningsAsErrors` turns every warning into a build failure. The C# compiler
in this course's sandbox shows the effect on a nullable warning in this `Program.cs`:

```csharp
using System;

string? region = Environment.GetEnvironmentVariable("SHIP_REGION");
Console.WriteLine($"region code length: {region.Length}");
```

```bash
csc -nullable:enable Program.cs                 # builds; the bug ships
csc -nullable:enable -warnaserror+ Program.cs   # refuses to build
```

```text
Program.cs(4,42): warning CS8602: Dereference of a possibly null reference.
Program.cs(4,42): error CS8602: Dereference of a possibly null reference.
```

Without `-warnaserror+` the program compiled with the warning and then crashed with a
`NullReferenceException`, because the variable was not set. The trade-off of
warnings as errors: a new SDK that adds a rule can break your build, and some warnings arrive
for reasons outside your code, such as a security advisory for a package. Pin `AnalysisLevel` if
you need upgrades to be quiet, and list codes that should stay warnings in `WarningsNotAsErrors`.

## Stamping the version

The SDK turns `<Version>2.4.1</Version>` into assembly attributes: the assembly and file
versions default to the version without its suffix, the informational version to the whole
version, and with the .NET 8 SDK or later and a git repository the commit hash is appended
after a `+`. Read them at run time to put the exact build in logs and crash reports:

```csharp
using System.Reflection;

// What the SDK generates from <Version>2.4.1</Version> in a git repository,
// written by hand here so that it runs with csc alone.
[assembly: AssemblyVersion("2.4.1.0")]
[assembly: AssemblyFileVersion("2.4.1.0")]
[assembly: AssemblyInformationalVersion("2.4.1+3f9c2ab")]

static class Program
{
    static void Main()
    {
        Assembly app = typeof(Program).Assembly;
        Console.WriteLine($"assembly version: {app.GetName().Version}");
        Console.WriteLine($"product version:  {app.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion}");
    }
}
```

```text
assembly version: 2.4.1.0
product version:  2.4.1+3f9c2ab
```

The informational version is the one to log: it names the release and the exact commit.

## Publishing

`dotnet publish` (Release by default) produces the files you deploy. The choices:

```bash
dotnet publish -c Release                                              # framework-dependent
dotnet publish -c Release -r linux-x64 --self-contained true           # includes the runtime
dotnet publish -c Release -r linux-x64 -p:PublishSingleFile=true       # one executable
dotnet publish -c Release -r linux-x64 --self-contained -p:PublishTrimmed=true
dotnet publish -c Release -r linux-x64 -p:PublishAot=true              # native code, no JIT
```

- **Framework-dependent** (the default): small, and it rolls forward to the newest patch of the
  runtime installed on the server, which brings security fixes; the server must have the runtime.
- **Self-contained**: carries its own runtime, so you control the version, at the cost of size
  and of shipping a new build for every runtime patch. `-r` names the **runtime identifier**.
- **Single-file**: bundles everything into one executable; still OS and architecture specific.
- **Trimmed**: self-contained only; removes unused code. Reflection the trimmer cannot see may
  break, which it reports as IL2xxx warnings: treat them as errors and test the trimmed build.
- **Native AOT**: compiles to native code at publish time for fast start-up and low memory. It
  implies trimming and single-file, and forbids runtime code generation (`Reflection.Emit`) and
  dynamic assembly loading. Set `<PublishAot>true</PublishAot>` in the project so its analyzers
  warn during ordinary builds.

## The software supply chain

Most of the code you ship is code you did not write. Protect the chain that brings it in:

- **Audit.** During restore, **NuGet Audit** checks packages against known vulnerabilities and
  reports NU1901 to NU1904 (low to critical). For projects targeting .NET 10 it covers
  transitive packages too (`NuGetAuditMode` is `all`). Run audits in CI on a schedule, because
  advisories appear for code you have not touched.
- **Lock.** `<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` writes
  `packages.lock.json`; commit it for applications and restore with
  `dotnet restore --locked-mode` in CI, so the build fails instead of silently resolving a
  different version.
- **Control sources.** A `nuget.config` that clears machine settings and uses one trusted feed,
  or **package source mapping**, prevents a public package from impersonating an internal one.
- **Reproduce.** Set `ContinuousIntegrationBuild` on the build server so stored paths are
  normalised, pin the SDK with `global.json`, and keep symbols for every release.
- **Depend on less.** Every package removed is one less to audit and update.

## Common mistakes

- Shipping a Debug build, or a framework-dependent build to a server without that runtime.
- Floating versions (`*`) in applications without a lock file.
- Suppressing analyzer warnings in bulk instead of fixing or configuring them.
- Turning on trimming or AOT and ignoring the IL warnings.
- Treating a clean audit today as a clean audit forever.

## Practice

1. A library at 3.2.0 renames a public method. What is the next version, and why?
2. `<PackageReference Include="Contoso.Json" Version="4.1.0" />` and versions 4.0.9, 4.1.0, 4.3.2
   and 5.0.0 exist. Which does NuGet pick, and what changes if a transitive dependency asks
   for `[4.2,5.0)`?
3. A team wants the smallest container image and fastest start-up for a small HTTP service that
   uses reflection-based JSON serialisation. What would you check before choosing Native AOT?

### Answers

1. 4.0.0: renaming a public member breaks callers, and SemVer reserves breaking changes for a
   new major version.
2. 4.1.0, the lowest version that satisfies "4.1.0 or higher". With the extra requirement, the
   lowest version satisfying both is 4.3.2.
3. Whether every dependency is AOT-compatible: reflection-based serialisation is a classic
   source of trim and AOT warnings, so switch to source-generated serialisation, publish with
   `PublishAot`, fix every warning, and test the published binary rather than the JIT build.

## Key takeaways

- The SDK-style project file lists only what differs; share settings with `Directory.Build.props`.
- Package versions are ranges resolved to the lowest match; SemVer tells callers what changed.
- Analyzers plus warnings as errors make problems impossible to ignore; pin levels deliberately.
- Publishing modes trade size, start-up and runtime control; trimming and AOT need clean warnings.
- Audit, lock, control sources and depend on less.

## Further reading

- [.NET application publishing overview](https://learn.microsoft.com/en-us/dotnet/core/deploying/)
- [NuGet package versioning](https://learn.microsoft.com/en-us/nuget/concepts/package-versioning)
- [Code analysis in .NET](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview)
- [Auditing package dependencies for security vulnerabilities](https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages)
