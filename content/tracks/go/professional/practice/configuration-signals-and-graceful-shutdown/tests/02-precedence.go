import (
	"bytes"
	"errors"
	"flag"
	"io"
	"strings"
	"time"
)

// precLookup returns a lookup function over a fixed environment.
func precLookup(env map[string]string) func(string) (string, bool) {
	return func(k string) (string, bool) { v, ok := env[k]; return v, ok }
}

func Test(t *testing.T) {
	keyOnly := precLookup(map[string]string{"ROTA_API_KEY": "k-1"})
	cfg, err := loadConfig(nil, keyOnly, io.Discard)
	check.NoError(err, "only the API key set")
	check.Equal(cfg, Config{Addr: "127.0.0.1:8080", Grace: 10 * time.Second, Workers: 4, APIKey: "k-1"}, "the defaults")

	full := precLookup(map[string]string{
		"ROTA_ADDR": ":9090", "ROTA_GRACE": "25s", "ROTA_WORKERS": "16", "ROTA_API_KEY": "k-2",
	})
	cfg, err = loadConfig([]string{}, full, io.Discard)
	check.NoError(err, "every setting from the environment")
	check.Equal(cfg, Config{Addr: ":9090", Grace: 25 * time.Second, Workers: 16, APIKey: "k-2"}, "the environment beats the defaults")

	cfg, err = loadConfig([]string{"-addr", ":7070", "-grace=40s", "-workers", "3"}, full, io.Discard)
	check.NoError(err, "flags and environment together")
	check.Equal(cfg, Config{Addr: ":7070", Grace: 40 * time.Second, Workers: 3, APIKey: "k-2"}, "flags beat the environment")

	cfg, err = loadConfig([]string{"-grace", "2s"}, full, io.Discard)
	check.NoError(err, "one flag with a full environment")
	check.Equal(cfg, Config{Addr: ":9090", Grace: 2 * time.Second, Workers: 16, APIKey: "k-2"}, "a flag replaces only its own setting")

	empty := precLookup(map[string]string{"ROTA_ADDR": "", "ROTA_API_KEY": "k-3"})
	cfg, err = loadConfig([]string{"-addr", "127.0.0.1:1"}, empty, io.Discard)
	check.NoError(err, "an empty ROTA_ADDR overridden by a flag")
	check.Equal(cfg.Addr, "127.0.0.1:1", "the flag's address")

	var usage bytes.Buffer
	_, err = loadConfig([]string{"-h"}, keyOnly, &usage)
	check.True(errors.Is(err, flag.ErrHelp), "-h returns flag.ErrHelp")
	check.True(!errors.Is(err, ErrConfig), "-h is not a configuration error")
	check.True(strings.Contains(usage.String(), "-workers") && strings.Contains(usage.String(), "-grace"), "-h prints the usage to the given writer")
	check.True(!strings.Contains(usage.String(), "api"), "the usage shows no flag for the API key")
}
