func Test(t *testing.T) {
	// Move to an empty folder: the defaults must come from the binary, not the disk.
	t.Chdir(t.TempDir())

	settings := map[string]string{
		"station":     "Pier Head",
		"port":        "8080",
		"interval":    "10m",
		"alert_level": "9.5",
		"upload_url":  "https://tides.example.org/api/readings?format=csv&v=2",
	}
	for key, want := range settings {
		got, ok := defaultSetting(key)
		check.True(ok, "defaultSetting finds a key from defaults.conf, run from another folder")
		check.Equal(got, want, "the value of a key from defaults.conf, with spaces around it removed")
	}

	_, ok := defaultSetting("password")
	check.True(!ok, "defaultSetting of a key that is not in the file")
	_, ok = defaultSetting("Port")
	check.True(!ok, "keys are matched exactly, case included")
	_, ok = defaultSetting("# Default settings for the tide gauge reporter.")
	check.True(!ok, "comment lines are not settings")
	_, ok = defaultSetting("")
	check.True(!ok, "the empty key is not a setting")
	_, ok = defaultSetting("upload_url = https")
	check.True(!ok, "a key ends at the first =")
}
