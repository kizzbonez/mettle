import (
	"errors"
	"flag"
	"fmt"
	"io"
	"strings"
)

// valLookup returns a lookup function over a fixed environment.
func valLookup(env map[string]string) func(string) (string, bool) {
	return func(k string) (string, bool) { v, ok := env[k]; return v, ok }
}

// valConfigError checks that err wraps ErrConfig and mentions every word in names.
func valConfigError(err error, what string, names ...string) {
	if err == nil {
		check.Fail(what + ": no error was returned")
		return
	}
	check.True(errors.Is(err, ErrConfig), what+": the error wraps ErrConfig")
	for _, n := range names {
		check.True(strings.Contains(err.Error(), n), what+": the error mentions "+n)
	}
}

func Test(t *testing.T) {
	key := map[string]string{"ROTA_API_KEY": "k-9"}
	with := func(k, v string) func(string) (string, bool) {
		env := map[string]string{"ROTA_API_KEY": "k-9", k: v}
		return valLookup(env)
	}

	_, err := loadConfig(nil, with("ROTA_GRACE", "soon"), io.Discard)
	valConfigError(err, "a ROTA_GRACE that is not a duration", "ROTA_GRACE")
	_, err = loadConfig(nil, with("ROTA_WORKERS", "eight"), io.Discard)
	valConfigError(err, "a ROTA_WORKERS that is not a number", "ROTA_WORKERS")

	cases := []struct {
		args []string
		name string
		what string
	}{
		{[]string{"-workers", "65"}, "workers", "65 workers"},
		{[]string{"-workers", "-1"}, "workers", "a negative number of workers"},
		{[]string{"-grace", "500ms"}, "grace", "a grace under one second"},
		{[]string{"-grace", "61s"}, "grace", "a grace over one minute"},
		{[]string{"-addr", ""}, "addr", "an empty address"},
	}
	for _, c := range cases {
		_, err := loadConfig(c.args, valLookup(key), io.Discard)
		valConfigError(err, c.what, c.name)
	}

	cfg, err := loadConfig([]string{"-workers", "64", "-grace", "1m"}, valLookup(key), io.Discard)
	check.NoError(err, "the largest allowed workers and grace")
	check.Equal(cfg.Workers, 64, "64 workers are allowed")
	cfg, err = loadConfig([]string{"-workers", "1", "-grace", "1s"}, valLookup(key), io.Discard)
	check.NoError(err, "the smallest allowed workers and grace")
	check.Equal(cfg.Workers, 1, "1 worker is allowed")

	_, err = loadConfig([]string{"-workers", "100", "-grace", "0s"}, valLookup(nil), io.Discard)
	valConfigError(err, "three problems at once", "workers", "grace", "ROTA_API_KEY")

	_, err = loadConfig([]string{"-api-key", "k-9"}, valLookup(key), io.Discard)
	valConfigError(err, "an -api-key flag, which must not exist")
	_, err = loadConfig([]string{"-port", "80"}, valLookup(key), io.Discard)
	valConfigError(err, "an unknown flag")
	_, err = loadConfig([]string{"-workers", "2", "extra"}, valLookup(key), io.Discard)
	valConfigError(err, "an argument that is not a flag")
	_, err = loadConfig([]string{"-workers", "two"}, valLookup(key), io.Discard)
	valConfigError(err, "a -workers value that is not a number")

	check.Equal(exitCode(nil), 0, "the exit code for no error")
	check.Equal(exitCode(flag.ErrHelp), 0, "the exit code for -h")
	check.Equal(exitCode(fmt.Errorf("start: %w", ErrConfig)), 2, "the exit code for a wrapped configuration error")
	check.Equal(exitCode(errors.New("database unreachable")), 1, "the exit code for a failure while running")
	check.Equal(exitCode(fmt.Errorf("parse: %w", flag.ErrHelp)), 0, "the exit code for a wrapped flag.ErrHelp")
}
