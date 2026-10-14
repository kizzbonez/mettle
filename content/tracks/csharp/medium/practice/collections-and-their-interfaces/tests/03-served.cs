var kitchen = new Kitchen();
IReadOnlyList<string> early = kitchen.Served;
Check.Equal(early.Count, 0, "Served of a new kitchen is empty");

kitchen.Order("ramen");
kitchen.Order("gyoza");
kitchen.Order("mochi");
Check.Equal(kitchen.Served.Count, 0, "orders that are only waiting are not served");
kitchen.Cook();
kitchen.Cook();

Check.Equal(kitchen.Served.Count, 2, "Served counts the dishes cooked");
Check.SequenceEqual(kitchen.Served, new[] { "ramen", "gyoza" }, "Served lists the dishes in the order they were cooked");
Check.Equal(early.Count, 2, "a view taken before anything was cooked shows the dishes cooked since");

kitchen.Cook();
Check.Equal(early[2], "mochi", "the early view shows the third dish as well");
Check.True(kitchen.Cook() is null && early.Count == 3, "a Cook with nothing waiting adds nothing to Served");

// Callers cannot change the record.
Check.True(!(kitchen.Served is List<string>), "Served cannot be cast back to List<string>");
var asCollection = (ICollection<string>)kitchen.Served;
Check.True(asCollection.IsReadOnly, "Served says it is read-only");
Check.Throws<NotSupportedException>(() => asCollection.Add("fake"), "adding to Served through ICollection");
Check.Throws<NotSupportedException>(() => asCollection.Clear(), "clearing Served through ICollection");
Check.Equal(kitchen.Served.Count, 3, "Served after the refused changes");
