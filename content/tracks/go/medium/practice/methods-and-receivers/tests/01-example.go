import "fmt"

func Test(t *testing.T) {
	room := NewCloakroom(2)
	a, ok := room.Check("green parka")
	check.True(ok, `the first Check("green parka") reports true`)
	check.Equal(a.String(), "C-001", "the first ticket, printed")
	b, ok := room.Check("red umbrella")
	check.True(ok && b == 2, "the second Check gives ticket 2 and true")
	_, ok = room.Check("blue scarf")
	check.True(!ok, "a Check when both hooks are taken reports false")
	check.Equal(room.Free(), 0, "Free() with both hooks taken")

	coat, ok := room.Collect(a)
	check.True(ok, "Collect(a) reports true")
	check.Equal(coat, "green parka", "the coat handed back for ticket a")
	coat, ok = room.Collect(a)
	check.True(!ok && coat == "", `collecting ticket a again gives "" and false`)
	c, ok := room.Check("blue scarf")
	check.True(ok && c == 3, "the next Check gives ticket 3, never a reused number")

	check.Equal(room.Uncollected(), Tickets{2, 3}, "Uncollected() at the end")
	check.Equal(fmt.Sprint(a, " ", room.Uncollected()), "C-001 C-002, C-003", `fmt.Sprint(a, " ", room.Uncollected())`)
	check.Equal(fmt.Sprint(Tickets{}), "none", "fmt.Sprint(Tickets{})")
}
