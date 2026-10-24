func Test(t *testing.T) {
	r := newRegister()
	check.Equal(r.Issue("Ada"), 1, `the first r.Issue("Ada")`)
	check.Equal(r.Issue("Bo"), 2, `then r.Issue("Bo")`)
	name, ok := r.Holder(2)
	check.True(ok, "r.Holder(2) finds an active wristband")
	check.Equal(name, "Bo", "the holder r.Holder(2) returns")
	check.True(r.Cancel(1), "r.Cancel(1) cancels an active wristband")
	check.True(!r.Cancel(1), "r.Cancel(1) a second time")
	name, ok = r.Holder(1)
	check.True(!ok, "r.Holder(1) after wristband 1 was cancelled")
	check.Equal(name, "", "the holder r.Holder(1) returns after it was cancelled")
	check.Equal(r.Issue("Cy"), 3, `r.Issue("Cy") after a cancellation`)
	check.Equal(r.Active(), 2, "r.Active() at the end of the example")

	var g Gate
	g.Scan()
	g.Scan()
	check.Equal(g.Total(), int64(2), "g.Total() after two scans of a zero Gate")

	calls := 0
	siteMap := lazySiteMap(func() []string {
		calls++
		return []string{"main stage", "food court", "first aid"}
	})
	check.Equal(calls, 0, "how many times load ran before siteMap was called")
	check.Equal(siteMap(), []string{"main stage", "food court", "first aid"}, "the first siteMap()")
	check.Equal(siteMap(), []string{"main stage", "food court", "first aid"}, "the second siteMap()")
	check.Equal(calls, 1, "how many times load ran after two calls of siteMap")
}
