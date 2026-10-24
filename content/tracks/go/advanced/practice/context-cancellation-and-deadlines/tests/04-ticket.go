import "context"

// otherKeys are keys that other code might use for its own values.
var otherKeys = []any{"ticket", "Ticket", "ticketKey", "ticketID", "ticketNumber", "ticket-number", "ticket_number", "order", 0, 1}

func Test(t *testing.T) {
	bg := context.Background()

	ticket, ok := ticketFrom(withTicket(bg, 17))
	check.True(ok, "a context made by withTicket carries a ticket")
	check.Equal(ticket, 17, "the ticket number carried")

	ticket, ok = ticketFrom(bg)
	check.True(!ok, "a context without a ticket")
	check.Equal(ticket, 0, "the ticket number reported for a context without a ticket")

	ticket, ok = ticketFrom(withTicket(bg, 0))
	check.True(ok, "ticket number 0 is a real ticket")
	check.Equal(ticket, 0, "the ticket number 0, carried")

	ticket, _ = ticketFrom(withTicket(withTicket(bg, 1), 2))
	check.Equal(ticket, 2, "the ticket when a second ticket is added on top of a first")

	parent := withTicket(bg, 5)
	child, cancel := context.WithCancel(parent)
	defer cancel()
	ticket, ok = ticketFrom(child)
	check.True(ok && ticket == 5, "a context derived from one with a ticket still carries it")

	plain := bg
	_ = withTicket(plain, 3)
	_, ok = ticketFrom(plain)
	check.True(!ok, "withTicket leaves the context it was given unchanged")

	crowded := withTicket(bg, 7)
	for _, key := range otherKeys {
		crowded = context.WithValue(crowded, key, 99)
	}
	ticket, ok = ticketFrom(crowded)
	check.True(ok, "a ticket is still found after other code stores values under its own keys")
	check.Equal(ticket, 7, "the ticket after other code stores values under strings and ints")

	others := bg
	for _, key := range otherKeys {
		others = context.WithValue(others, key, 99)
	}
	_, ok = ticketFrom(others)
	check.True(!ok, "values other code stores under strings and ints are not taken for a ticket")
}
