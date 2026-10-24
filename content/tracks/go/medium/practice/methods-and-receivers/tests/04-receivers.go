import "reflect"

// methodNames lists the methods in a type's method set.
func methodNames(typ reflect.Type) []string {
	var names []string
	for m := range typ.Methods() {
		names = append(names, m.Name)
	}
	return names
}

func Test(t *testing.T) {
	check.Equal(methodNames(reflect.TypeFor[Cloakroom]()), []string(nil), "the method set of a Cloakroom value (all its methods need one receiver kind)")
	check.Equal(methodNames(reflect.TypeFor[*Cloakroom]()), []string{"Check", "Collect", "Free", "Uncollected"}, "the method set of *Cloakroom")
	check.Equal(methodNames(reflect.TypeFor[Ticket]()), []string{"String"}, "the method set of a Ticket value")
	check.Equal(methodNames(reflect.TypeFor[Tickets]()), []string{"String"}, "the method set of a Tickets value")

	room := NewCloakroom(2)
	check.True(room != nil, "NewCloakroom returns a cloakroom, not nil")
	room.Check("wool coat")
	room.Check("cap")
	check.Equal(room.Free(), 0, "two Checks through the pointer NewCloakroom returned fill two hooks")
	saved := *room
	room.Collect(1)
	check.Equal(room.Free(), 1, "a Collect through the pointer frees a hook")
	check.Equal(saved.capacity, 2, "NewCloakroom stores the capacity")
}
