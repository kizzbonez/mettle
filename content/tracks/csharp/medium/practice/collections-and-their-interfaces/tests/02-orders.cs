var kitchen = new Kitchen();
Check.Equal(kitchen.Waiting, 0, "a new kitchen has no orders waiting");
Check.True(kitchen.NextUp is null, "NextUp when nothing is waiting");
Check.True(kitchen.Cook() is null, "Cook when nothing is waiting");
Check.Equal(kitchen.Served.Count, 0, "cooking with nothing waiting serves nothing");

kitchen.Order("salad");
kitchen.Order("steak");
kitchen.Order("tart");
Check.Equal(kitchen.NextUp, "salad", "the first order placed is next up");
Check.Equal(kitchen.NextUp, "salad", "NextUp does not remove the order");
Check.Equal(kitchen.Waiting, 3, "looking at the next order leaves every order waiting");

Check.Equal(kitchen.Cook(), "salad", "the first order placed is cooked first");
Check.Equal(kitchen.NextUp, "steak", "after one is cooked, the second order is next up");
kitchen.Order("soup");
Check.Equal(kitchen.Cook(), "steak", "an order placed later waits behind the earlier ones");
Check.Equal(kitchen.Cook(), "tart", "the third order placed is cooked third");
Check.Equal(kitchen.Cook(), "soup", "the order placed last is cooked last");
Check.Equal(kitchen.Waiting, 0, "every order has been cooked");
Check.True(kitchen.Cook() is null, "Cook after every order has been cooked");
Check.True(kitchen.NextUp is null, "NextUp after every order has been cooked");

// The same dish can be ordered many times.
for (int i = 0; i < 50; i++)
{
    kitchen.Order(i % 2 == 0 ? "chips" : "peas");
}
Check.Equal(kitchen.Waiting, 50, "fifty orders, many of them the same dish");
Check.Equal(kitchen.Cook(), "chips", "the first of fifty orders");
Check.Equal(kitchen.Cook(), "peas", "the second of fifty orders");
Check.Equal(kitchen.Waiting, 48, "the orders left after two of fifty were cooked");
