import (
	"bytes"
	"encoding/json"
	"strings"
)

func Test(t *testing.T) {
	menu, err := readMenu(strings.NewReader(`{
  "truck": "Saltmarsh",
  "dishes": [
    {"name": "Bean chilli", "price_cents": 750, "heat": "hot", "vegan": true, "allergens": []},
    {"name": "Fish, chips and peas", "price_cents": 995, "heat": "mild", "allergens": ["fish", "gluten"]}
  ]
}`))
	check.NoError(err, "readMenu of the example menu")
	check.Equal(menu.Truck, "Saltmarsh", "the truck's name")
	check.Equal(len(menu.Dishes), 2, "the number of dishes")
	if len(menu.Dishes) != 2 {
		return
	}
	check.Equal(menu.Dishes[0].Heat, Hot, "the heat of the bean chilli")
	check.Equal(menu.Dishes[1].Allergens, []string{"fish", "gluten"}, "the allergens of the fish and chips")

	data, err := json.Marshal(menu.Dishes[0])
	check.NoError(err, "json.Marshal of the bean chilli")
	check.Equal(string(data), `{"name":"Bean chilli","price_cents":750,"heat":"hot","vegan":true}`, "the JSON of the bean chilli")

	var buf bytes.Buffer
	check.NoError(writePriceList(&buf, menu), "writePriceList of the example menu")
	check.Equal(buf.String(), "dish,price\nBean chilli,7.50\n\"Fish, chips and peas\",9.95\n", "the price list of the example menu")

	_, err = readMenu(strings.NewReader(`{"truck": "Saltmarsh", "dishs": []}`))
	check.Error(err, "readMenu of a menu with the mistyped member \"dishs\"")
}
