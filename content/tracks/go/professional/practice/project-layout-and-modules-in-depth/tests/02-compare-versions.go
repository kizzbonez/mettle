func Test(t *testing.T) {
	cases := []struct {
		a, b string
		want int
		what string
	}{
		{"v1.4.0", "v1.4.0", 0, "equal versions"},
		{"v1.4.0", "v1.3.9", 1, "a higher minor version"},
		{"v1.3.9", "v1.4.0", -1, "a lower minor version"},
		{"v2.0.0", "v1.99.99", 1, "a higher major version beats any minor and patch"},
		{"v0.9.0", "v1.0.0", -1, "v0 is below v1"},
		{"v1.2.10", "v1.2.9", 1, "a two-digit patch number"},
		{"v1.2.9", "v1.2.10", -1, "a one-digit patch below a two-digit one"},
		{"v10.0.0", "v9.0.0", 1, "a two-digit major number"},
		{"v1.0.0", "v1.0.1", -1, "a lower patch version"},
	}
	for _, c := range cases {
		check.Equal(compareVersions(c.a, c.b), c.want, "compareVersions: "+c.what+" ("+c.a+" vs "+c.b+")")
	}
}
