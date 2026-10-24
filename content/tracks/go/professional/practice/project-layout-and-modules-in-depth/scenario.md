The tram depot's timetable services are Go modules that share a handful of libraries. Before
each upgrade night, the release engineer pastes `go mod graph` output into a small checker that
says which version of every library the build will really use.
