func Test(t *testing.T) {
	room := NewCloakroom(3)
	check.Equal(room.Free(), 3, "Free() on a new cloakroom")
	check.Equal(len(room.Uncollected()), 0, "Uncollected() on a new cloakroom")

	first, _ := room.Check("tweed jacket")
	second, _ := room.Check("yellow raincoat")
	third, _ := room.Check("black coat")
	check.Equal(Tickets{first, second, third}, Tickets{1, 2, 3}, "three Checks hand out tickets 1, 2 and 3")
	check.Equal(room.Free(), 0, "Free() when the cloakroom is full")
	_, ok := room.Check("spare hat")
	check.True(!ok, "a Check on a full cloakroom reports false")

	coat, ok := room.Collect(second)
	check.True(ok && coat == "yellow raincoat", "collecting the second ticket gives its own coat")
	check.Equal(room.Free(), 1, "Free() after one coat is collected")
	_, ok = room.Collect(Ticket(99))
	check.True(!ok, "collecting a ticket that was never handed out reports false")
	_, ok = room.Collect(second)
	check.True(!ok, "collecting the same ticket twice reports false the second time")
	check.Equal(room.Free(), 1, "failed Collects do not free a hook")

	next, ok := room.Check("spare hat")
	check.True(ok, "a Check after a hook is freed reports true")
	check.Equal(next, Ticket(4), "the ticket after 3, even though ticket 2's hook is free again")
	check.Equal(room.Uncollected(), Tickets{1, 3, 4}, "Uncollected() lists the coats still hanging, lowest first")

	other := NewCloakroom(1)
	mine, _ := other.Check("denim jacket")
	check.Equal(mine, Ticket(1), "a second cloakroom keeps its own ticket numbers")
	check.Equal(room.Free(), 0, "Checks in another cloakroom do not change this one")

	none := NewCloakroom(0)
	_, ok = none.Check("anything")
	check.True(!ok, "a cloakroom with no hooks takes no coats")
}
