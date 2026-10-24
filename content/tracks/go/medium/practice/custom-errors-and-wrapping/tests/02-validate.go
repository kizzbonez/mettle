import "errors"

// fieldErrorsIn walks the whole error tree and lists every *FieldError in it.
func fieldErrorsIn(err error) []FieldError {
	var found []FieldError
	var walk func(error)
	walk = func(e error) {
		if fe, ok := e.(*FieldError); ok {
			found = append(found, *fe)
			return
		}
		switch u := e.(type) {
		case interface{ Unwrap() []error }:
			for _, inner := range u.Unwrap() {
				walk(inner)
			}
		case interface{ Unwrap() error }:
			if inner := u.Unwrap(); inner != nil {
				walk(inner)
			}
		}
	}
	if err != nil {
		walk(err)
	}
	return found
}

func Test(t *testing.T) {
	check.Equal((&FieldError{Field: "hours", Problem: "must be from 1 to 4"}).Error(), "hours must be from 1 to 4", "the message of a FieldError")

	for _, b := range []Booking{
		{Name: "Brownies", Day: "Mon", Start: 9, Hours: 1},
		{Name: "Brownies", Day: "Mon", Start: 21, Hours: 4},
		{Name: "Brownies", Day: "Sun", Start: 12, Hours: 3},
	} {
		check.NoError(validate(b), "validate of a booking at the edges of the allowed hours")
	}

	err := validate(Booking{Name: "Brownies", Day: "Mon", Start: 22, Hours: 2})
	check.Equal(fieldErrorsIn(err), []FieldError{{Field: "start", Problem: "must be from 9 to 21"}}, "the field errors for a start at 22:00")
	_, ok := errors.AsType[*FieldError](err)
	check.True(ok, "errors.AsType finds a *FieldError in validate's error")

	err = validate(Booking{Name: "Brownies", Day: "Mon", Start: 10, Hours: 0})
	check.Equal(fieldErrorsIn(err), []FieldError{{Field: "hours", Problem: "must be from 1 to 4"}}, "the field errors for zero hours")
	err = validate(Booking{Name: "Brownies", Day: "Mon", Start: 10, Hours: 5})
	check.Equal(fieldErrorsIn(err), []FieldError{{Field: "hours", Problem: "must be from 1 to 4"}}, "the field errors for five hours")

	err = validate(Booking{Name: " \t ", Day: "Fri", Start: 8, Hours: 6})
	want := []FieldError{
		{Field: "name", Problem: "is empty"},
		{Field: "start", Problem: "must be from 9 to 21"},
		{Field: "hours", Problem: "must be from 1 to 4"},
	}
	check.Equal(fieldErrorsIn(err), want, "every field error, in order, for a booking with three problems")
	check.Equal(err.Error(), "name is empty\nstart must be from 9 to 21\nhours must be from 1 to 4", "the message of an error with three problems")
}
