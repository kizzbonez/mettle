// The example from the instructions.
var box = new BoxSize(20, 20, 10);
Check.Equal(box.Volume, 4000, "the volume of a 20x20x10 box");
Check.Equal(box.ToString(), "20x20x10", "the printed size of that box");
var (width, _, height) = box;
Check.Equal(width, 20, "the width taken out of the box by deconstruction");
Check.Equal(height, 10, "the height taken out of the box by deconstruction");

var brownie = Allergen.Gluten | Allergen.Milk | Allergen.Egg;
Check.True(Bakery.IsSafeFor(brownie, Allergen.Nuts), "a brownie for a customer who avoids nuts");
Check.True(!Bakery.IsSafeFor(brownie, Allergen.Milk | Allergen.Nuts), "a brownie for a customer who avoids milk and nuts");
Check.Equal(Bakery.Without(brownie, Allergen.Milk | Allergen.Egg), Allergen.Gluten, "a brownie with milk and egg taken out");

Check.Equal<CakeSize?>(Bakery.SizeFor(20), CakeSize.Medium, "the cake size with a diameter of 20");
Check.Equal<CakeSize?>(Bakery.SizeFor(18), null, "the cake size with a diameter of 18");

var (full, left) = Bakery.Pack(14, 4);
Check.Equal(full, 3, "the full boxes for 14 cakes, 4 to a box");
Check.Equal(left, 2, "the cakes left over from 14, 4 to a box");
