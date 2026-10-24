import "fmt"

func Test(t *testing.T) {
	check.Equal(fmt.Sprint(Ticket(7)), "C-007", "a one-digit ticket, printed by value")
	check.Equal(fmt.Sprint(Ticket(42)), "C-042", "a two-digit ticket, printed by value")
	check.Equal(fmt.Sprint(Ticket(950)), "C-950", "a three-digit ticket, printed by value")
	check.Equal(fmt.Sprint(Ticket(1204)), "C-1204", "a four-digit ticket, printed by value")
	check.Equal(fmt.Sprintf("%v and %v", Ticket(12), Ticket(13)), "C-012 and C-013", "the %v verb on Ticket values")

	check.Equal(fmt.Sprint(Tickets{9}), "C-009", "a list of one ticket")
	check.Equal(fmt.Sprint(Tickets{4, 10, 100}), "C-004, C-010, C-100", "a list of three tickets")
	check.Equal(fmt.Sprint(Tickets{}), "none", "an empty list of tickets")
	check.Equal(fmt.Sprint(Tickets(nil)), "none", "a nil list of tickets")
	check.Equal(fmt.Sprintf("%v", []Tickets{{3}, {}}), "[C-003 none]", "Tickets values printed inside a slice")
}
