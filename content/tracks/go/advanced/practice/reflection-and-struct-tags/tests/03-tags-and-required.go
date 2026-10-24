type testBooking struct {
	Member  string `form:"member,required"`
	Boat    string `form:"boat"`
	Hours   int    `form:"hours,required"`
	Note    string
	Office  string `form:"-"`
	Empty   string `form:""`
	Option  string `form:",required"`
	private string `form:"private"`
	Helmet  bool   `form:"helmet"`
}

func Test(t *testing.T) {
	b := testBooking{Boat: "Heron", Office: "keep", Note: "keep", private: "keep", Helmet: true}
	form := map[string]string{
		"member": "Cy", "hours": "2", "Note": "x", "Office": "x", "-": "x", "": "x", "private": "x",
	}
	check.NoError(fill(&b, form), "fill with a form that has keys for untagged, \"-\" and unexported fields")
	want := testBooking{Member: "Cy", Boat: "Heron", Hours: 2, Office: "keep", Note: "keep", private: "keep", Helmet: true}
	check.Equal(b, want, "only exported fields with a key are filled; keys missing from the form leave their fields as they were")

	check.NoError(fill(&b, map[string]string{"member": "Di", "hours": "3", "boat": "   "}), "fill where an optional key holds only spaces")
	check.Equal(b.Boat, "Heron", "an optional field whose text is only spaces keeps its value")

	err := fill(&b, map[string]string{"hours": "1"})
	check.ErrorIs(err, errMissing, "a missing required member returns errMissing")
	check.Equal(err.Error(), `fill: missing required field "member"`, "the message for a missing member")

	err = fill(&b, map[string]string{"member": "Ed", "hours": "  "})
	check.ErrorIs(err, errMissing, "a required key that holds only spaces counts as missing")
	check.Equal(err.Error(), `fill: missing required field "hours"`, "the message for hours that holds only spaces")

	err = fill(&b, map[string]string{"hours": "x"})
	check.ErrorIs(err, errMissing, "fields are checked in order: the missing member comes before the bad hours")
}
