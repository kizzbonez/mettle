import (
	"encoding/json"
	"strings"
)

func Test(t *testing.T) {
	for _, c := range []struct {
		heat Heat
		want string
	}{{Mild, `"mild"`}, {Hot, `"hot"`}, {Fiery, `"fiery"`}} {
		data, err := c.heat.MarshalJSON()
		check.NoError(err, "MarshalJSON of a valid heat")
		check.Equal(string(data), c.want, "MarshalJSON writes the heat's name as a JSON string")
	}
	data, err := json.Marshal([]Heat{Fiery, Mild})
	check.NoError(err, "json.Marshal of a slice of heats")
	check.Equal(string(data), `["fiery","mild"]`, "json.Marshal uses MarshalJSON for every heat")

	_, err = json.Marshal(Heat(7))
	check.Error(err, "a heat with no name cannot be marshalled")
	_, err = json.Marshal(Heat(-1))
	check.Error(err, "a negative heat cannot be marshalled")

	for _, c := range []struct {
		in   string
		want Heat
	}{{`"mild"`, Mild}, {`"hot"`, Hot}, {`"fiery"`, Fiery}} {
		h := Heat(2)
		check.NoError(h.UnmarshalJSON([]byte(c.in)), "UnmarshalJSON of a known name")
		check.Equal(h, c.want, "UnmarshalJSON sets the heat named in the JSON string")
	}

	var h Heat
	err = h.UnmarshalJSON([]byte(`"volcanic"`))
	check.Error(err, "UnmarshalJSON of an unknown name")
	if err != nil {
		check.True(strings.Contains(err.Error(), `unknown heat "volcanic"`), "the error for an unknown name quotes the name")
	}
	check.Error(h.UnmarshalJSON([]byte(`"Hot"`)), "names are matched exactly, in lower case")
	check.Error(h.UnmarshalJSON([]byte(`2`)), "a heat must be a JSON string, not a number")

	var d Dish
	err = json.Unmarshal([]byte(`{"name":"Curry","price_cents":800,"heat":"fiery"}`), &d)
	check.NoError(err, "json.Unmarshal of a dish with a heat")
	check.Equal(d.Heat, Fiery, "json.Unmarshal uses UnmarshalJSON for a dish's heat")
	err = json.Unmarshal([]byte(`{"name":"Curry","price_cents":800,"heat":"lava"}`), &d)
	check.Error(err, "json.Unmarshal of a dish with an unknown heat")
}
