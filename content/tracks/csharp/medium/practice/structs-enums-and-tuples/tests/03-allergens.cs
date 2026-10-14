var shortbread = Allergen.Gluten | Allergen.Milk;
var macaron = Allergen.Egg | Allergen.Nuts;
var everything = Allergen.Gluten | Allergen.Milk | Allergen.Egg | Allergen.Nuts;

// IsSafeFor
Check.True(Bakery.IsSafeFor(shortbread, Allergen.Egg), "a recipe without the one allergen the customer avoids");
Check.True(!Bakery.IsSafeFor(shortbread, Allergen.Gluten), "a recipe that contains the one allergen the customer avoids");
Check.True(!Bakery.IsSafeFor(macaron, Allergen.Milk | Allergen.Nuts), "one allergen out of two avoided ones makes a recipe unsafe");
Check.True(!Bakery.IsSafeFor(macaron, Allergen.Nuts | Allergen.Egg), "a recipe that contains both avoided allergens");
Check.True(!Bakery.IsSafeFor(shortbread, everything), "a customer who avoids every allergen and a recipe with some");
Check.True(Bakery.IsSafeFor(Allergen.None, everything), "a recipe with no allergens is safe for everyone");
Check.True(Bakery.IsSafeFor(macaron, Allergen.None), "a customer who avoids None can eat anything");
Check.True(Bakery.IsSafeFor(everything, Allergen.None), "a customer who avoids None can eat even a recipe with every allergen");
Check.True(Bakery.IsSafeFor(shortbread, macaron), "two sets of allergens with nothing in common");

// Without
Check.Equal(Bakery.Without(shortbread, Allergen.Milk), Allergen.Gluten, "one allergen taken out of two");
Check.Equal(Bakery.Without(shortbread, Allergen.Egg), shortbread, "taking out an allergen the recipe does not contain");
Check.Equal(Bakery.Without(macaron, Allergen.Nuts | Allergen.Milk), Allergen.Egg, "an allergen that was not in the recipe stays out");
Check.Equal(Bakery.Without(macaron, macaron), Allergen.None, "taking out every allergen of the recipe");
Check.Equal(Bakery.Without(macaron, Allergen.None), macaron, "taking out None");
Check.Equal(Bakery.Without(Allergen.None, everything), Allergen.None, "taking allergens out of a recipe that has none");
Check.Equal(
    Bakery.Without(everything, Allergen.Gluten | Allergen.Nuts).ToString(),
    "Milk, Egg",
    "the allergens left after taking two out of four, as the flags enum prints them");
