// sectionJob runs a nested pair of deferred sections around some work.
func sectionJob(lb *Logbook) {
	defer section("reset", lb)()
	lb.add("dim the lights")
	func() {
		defer section("props", lb)()
		lb.add("rewind the clock")
	}()
	lb.add("start the timer")
}

func Test(t *testing.T) {
	lb := &Logbook{}
	end := section("tidy", lb)
	check.Equal(lb.Lines, []string{"begin tidy"}, "section logs begin as soon as it is called")
	end()
	check.Equal(lb.Lines, []string{"begin tidy", "end tidy"}, "the function section returns logs end")

	lb = &Logbook{}
	sectionJob(lb)
	want := []string{"begin reset", "dim the lights", "begin props", "rewind the clock", "end props", "start the timer", "end reset"}
	check.Equal(lb.Lines, want, "the log of two nested sections used with defer")
}
