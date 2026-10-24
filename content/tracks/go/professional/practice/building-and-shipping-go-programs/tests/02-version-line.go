import "runtime/debug"

func Test(t *testing.T) {
	const rev = "4e1c0a9b7d2f8e6c5a3b1d0f9e8c7b6a5d4c3b2a"

	check.Equal(versionLine(gaugeInfo("v2.3.1", "vcs.revision", rev, "vcs.modified", "false")),
		"tidegauge v2.3.1 (4e1c0a9, go1.27.3)", "a tagged, clean build")
	check.Equal(versionLine(gaugeInfo("v2.3.1-0.20261012093000-4e1c0a9b7d2f", "vcs.revision", rev, "vcs.modified", "true")),
		"tidegauge v2.3.1-0.20261012093000-4e1c0a9b7d2f (4e1c0a9-dirty, go1.27.3)", "a build with changes in the working tree")
	check.Equal(versionLine(gaugeInfo("(devel)", "vcs.revision", rev)),
		"tidegauge dev (4e1c0a9, go1.27.3)", `a build whose module version is "(devel)"`)
	check.Equal(versionLine(gaugeInfo("", "GOOS", "linux")),
		"tidegauge dev (unknown commit, go1.27.3)", "a build outside a repository, with no module version")
	check.Equal(versionLine(gaugeInfo("v2.3.1", "vcs.modified", "true")),
		"tidegauge v2.3.1 (unknown commit, go1.27.3)", "a build with vcs.modified but no revision")
	check.Equal(versionLine(nil), "tidegauge dev (unknown commit, unknown Go)", "versionLine with no build information")

	other := gaugeInfo("v2.3.1", "vcs.revision", rev)
	other.GoVersion = "go1.26.6"
	check.Equal(versionLine(other), "tidegauge v2.3.1 (4e1c0a9, go1.26.6)", "the Go version comes from the build information")

	// What -ldflags "-X main.version=v3.0.0-rc1" does to the package variable.
	t.Cleanup(func() { version = "dev" })
	version = "v3.0.0-rc1"
	check.Equal(versionLine(gaugeInfo("v2.3.1", "vcs.revision", rev)),
		"tidegauge v3.0.0-rc1 (4e1c0a9, go1.27.3)", "a version set with -X wins over the module version")
	check.Equal(versionLine(nil), "tidegauge v3.0.0-rc1 (unknown commit, unknown Go)", "a version set with -X and no build information")

	version = "dev"
	real, ok := debug.ReadBuildInfo()
	check.True(ok, "the test binary has build information")
	check.Equal(versionLine(real), "tidegauge dev (unknown commit, "+real.GoVersion+")", "versionLine of this test binary")
}
