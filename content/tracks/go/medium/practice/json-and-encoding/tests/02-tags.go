import "encoding/json"

func Test(t *testing.T) {
	plain := Dish{Name: "Toastie", PriceCents: 400, Heat: Mild, Recipe: "butter both sides"}
	data, err := json.Marshal(plain)
	check.NoError(err, "json.Marshal of a dish that is not vegan and has no allergens")
	check.Equal(string(data), `{"name":"Toastie","price_cents":400,"heat":"mild"}`, "vegan, allergens and the recipe are left out of a plain dish")

	full := Dish{Name: "Dal", PriceCents: 650, Heat: Fiery, Vegan: true, Allergens: []string{"mustard"}, Recipe: "secret"}
	data, err = json.Marshal(full)
	check.NoError(err, "json.Marshal of a vegan dish with allergens")
	check.Equal(string(data), `{"name":"Dal","price_cents":650,"heat":"fiery","vegan":true,"allergens":["mustard"]}`, "the JSON names and order of every field of a full dish")

	data, err = json.Marshal(Menu{Truck: "Saltmarsh", Dishes: []Dish{plain}})
	check.NoError(err, "json.Marshal of a menu")
	check.Equal(string(data), `{"truck":"Saltmarsh","dishes":[{"name":"Toastie","price_cents":400,"heat":"mild"}]}`, "the JSON of a menu with one dish")

	data, err = json.Marshal(Dish{Name: "Water", PriceCents: 100, Allergens: []string{}})
	check.NoError(err, "json.Marshal of a dish with an empty allergen list")
	check.Equal(string(data), `{"name":"Water","price_cents":100,"heat":"mild"}`, "an empty allergen list is left out too")

	var d Dish
	err = json.Unmarshal([]byte(`{"name":"Wrap","price_cents":550,"heat":"hot","vegan":true,"allergens":["sesame"],"Recipe":"leaked"}`), &d)
	check.NoError(err, "json.Unmarshal of a dish")
	check.Equal(d, Dish{Name: "Wrap", PriceCents: 550, Heat: Hot, Vegan: true, Allergens: []string{"sesame"}}, "every tagged field is read back, and the recipe never is")
}
