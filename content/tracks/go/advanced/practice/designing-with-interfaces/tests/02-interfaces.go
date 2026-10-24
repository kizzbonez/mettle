import (
	"reflect"
	"strings"
)

func Test(t *testing.T) {
	methods := func(typ reflect.Type) string {
		var found []string
		for m := range typ.Methods() {
			found = append(found, m.Name+" "+m.Type.String())
		}
		return strings.Join(found, "; ")
	}
	check.Equal(methods(reflect.TypeFor[Diary]()),
		"Add func(time.Time, string) error; Booked func(time.Time) (int, error)",
		"the methods of Diary: exactly Booked and Add, with the signatures from the instructions")
	check.Equal(methods(reflect.TypeFor[Notifier]()),
		"Notify func(string, string) error",
		"the methods of Notifier: exactly Notify, with the signature from the instructions")

	var got []string
	record := NotifyFunc(func(customer, message string) error {
		got = append(got, customer+"|"+message)
		return nil
	})
	asNotifier, ok := any(record).(interface {
		Notify(customer, message string) error
	})
	check.True(ok, "NotifyFunc has a method Notify(customer, message string) error")
	check.NoError(asNotifier.Notify("Mr Lee", "tuning at ten"), "calling Notify on a NotifyFunc")
	check.Equal(got, []string{"Mr Lee|tuning at ten"}, "Notify on a NotifyFunc calls the function with the same arguments")

	var n Notifier = record
	_, isNotifier := n.(interface {
		Notify(customer, message string) error
	})
	check.True(isNotifier, "a NotifyFunc can be used as a Notifier")
}
