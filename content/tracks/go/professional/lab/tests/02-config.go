import "strings"

func Test(t *testing.T) {
	token := mooringEnv("MOORINGS_ADMIN_TOKEN", mooringToken)

	cfg, err := loadConfig(nil, token)
	check.NoError(err, "loadConfig with only the admin token set")
	check.Equal(cfg, Config{Addr: ":8080", Berths: 12, MaxBody: 4096, AdminToken: mooringToken},
		"the Config with only the admin token set: every other setting has its default")

	env := mooringEnv(
		"MOORINGS_ADDR", "127.0.0.1:9090",
		"MOORINGS_BERTHS", "30",
		"MOORINGS_MAX_BODY", "8192",
		"MOORINGS_ADMIN_TOKEN", mooringToken,
	)
	cfg, err = loadConfig(nil, env)
	check.NoError(err, "loadConfig with every setting in the environment")
	check.Equal(cfg, Config{Addr: "127.0.0.1:9090", Berths: 30, MaxBody: 8192, AdminToken: mooringToken},
		"the environment overrides the defaults")

	cfg, err = loadConfig([]string{"-addr", ":7000", "-berths=40", "-max-body", "2048"}, env)
	check.NoError(err, "loadConfig with flags and the environment")
	check.Equal(cfg, Config{Addr: ":7000", Berths: 40, MaxBody: 2048, AdminToken: mooringToken},
		"flags override the environment")

	cfg, err = loadConfig([]string{"-berths", "5"}, env)
	check.NoError(err, "loadConfig with one flag and the environment")
	check.Equal(cfg, Config{Addr: "127.0.0.1:9090", Berths: 5, MaxBody: 8192, AdminToken: mooringToken},
		"a flag overrides only its own setting")

	_, err = loadConfig([]string{"-admin-token", mooringToken}, token)
	check.Error(err, "there is no -admin-token flag: secrets never go in flags")
	_, err = loadConfig([]string{"-colour", "blue"}, token)
	check.Error(err, "loadConfig with an unknown flag")
	_, err = loadConfig([]string{"-berths", "many"}, token)
	check.Error(err, "loadConfig with a flag value that is not a number")

	_, err = loadConfig(nil, mooringEnv("MOORINGS_ADMIN_TOKEN", mooringToken, "MOORINGS_BERTHS", "lots"))
	check.Error(err, "loadConfig with MOORINGS_BERTHS that is not a number")
	check.True(strings.Contains(err.Error(), "MOORINGS_BERTHS"), "the error for a bad MOORINGS_BERTHS names the variable")
	_, err = loadConfig(nil, mooringEnv("MOORINGS_ADMIN_TOKEN", mooringToken, "MOORINGS_MAX_BODY", "4k"))
	check.Error(err, "loadConfig with MOORINGS_MAX_BODY that is not a number")
	check.True(strings.Contains(err.Error(), "MOORINGS_MAX_BODY"), "the error for a bad MOORINGS_MAX_BODY names the variable")

	for _, c := range []struct {
		args  []string
		want  string
		about string
	}{
		{[]string{"-berths", "0"}, "berths must be between 1 and 200", "0 berths"},
		{[]string{"-berths", "201"}, "berths must be between 1 and 200", "201 berths"},
		{[]string{"-max-body", "255"}, "max-body must be between 256 and 1048576", "a max-body of 255"},
		{[]string{"-max-body", "1048577"}, "max-body must be between 256 and 1048576", "a max-body of 1048577"},
	} {
		_, err := loadConfig(c.args, token)
		check.Error(err, "loadConfig refuses "+c.about)
		check.Equal(err.Error(), c.want, "the error for "+c.about)
	}
	for _, args := range [][]string{{"-berths", "1"}, {"-berths", "200"}, {"-max-body", "256"}, {"-max-body", "1048576"}} {
		_, err := loadConfig(args, token)
		check.NoError(err, "loadConfig accepts the limits of each range ("+strings.Join(args, " ")+")")
	}

	_, err = loadConfig(nil, mooringEnv())
	check.Error(err, "loadConfig without MOORINGS_ADMIN_TOKEN")
	check.Equal(err.Error(), "MOORINGS_ADMIN_TOKEN must be set to at least 16 characters", "the error without an admin token")
	_, err = loadConfig(nil, mooringEnv("MOORINGS_ADMIN_TOKEN", "short-token-15c"))
	check.Error(err, "loadConfig with an admin token of 15 characters")
	_, err = loadConfig(nil, mooringEnv("MOORINGS_ADMIN_TOKEN", "exactly-16-chars"))
	check.NoError(err, "loadConfig with an admin token of exactly 16 characters")
}
