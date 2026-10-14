var slot = new Slot("Juice", 1.50m, 4);
Check.Equal(slot.Product, "Juice", "the product of a new slot");
Check.Equal(slot.Price, 1.50m, "the price of a new slot");
Check.Equal(slot.Stock, 4, "the stock of a new slot");

// Price
slot.Price = 1.80m;
Check.Equal(slot.Price, 1.80m, "a new positive price is stored");
slot.Price = 0.01m;
Check.Equal(slot.Price, 0.01m, "the smallest positive price is stored");
slot.Price = 2m;
Check.Throws<ArgumentOutOfRangeException>(() => slot.Price = 0m, "a price of 0");
Check.Throws<ArgumentOutOfRangeException>(() => slot.Price = -1.50m, "a negative price");
Check.Equal(slot.Price, 2m, "refused prices leave the old price");
Check.Throws<ArgumentOutOfRangeException>(() => new Slot("Gum", 0m, 3), "a new slot with a price of 0");
Check.Throws<ArgumentOutOfRangeException>(() => new Slot("Gum", -0.50m, 3), "a new slot with a negative price");

// Stock
slot.Stock = 9;
Check.Equal(slot.Stock, 9, "a positive stock is stored");
slot.Stock = 0;
Check.Equal(slot.Stock, 0, "a stock of 0 is stored");
slot.Stock = -1;
Check.Equal(slot.Stock, 0, "a stock of -1 is stored as 0");
slot.Stock = 3;
slot.Stock -= 10;
Check.Equal(slot.Stock, 0, "taking more than is left runs the setter and stores 0");
slot.Stock += 2;
Check.Equal(slot.Stock, 2, "adding to the stock");
Check.Equal(new Slot("Gum", 0.60m, -5).Stock, 0, "a new slot with a negative stock starts at 0");
