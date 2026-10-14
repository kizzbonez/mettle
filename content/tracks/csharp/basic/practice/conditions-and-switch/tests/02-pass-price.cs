Check.True(SkiHill.PassPrice(0) == 0m, "a baby skis for free");
Check.True(SkiHill.PassPrice(5) == 0m, "a 5-year-old is still under 6 and skis for free");
Check.True(SkiHill.PassPrice(6) == 25m, "a 6-year-old pays the price for ages 6 to 15");
Check.True(SkiHill.PassPrice(15) == 25m, "a 15-year-old still pays the price for ages 6 to 15");
Check.True(SkiHill.PassPrice(16) == 48m, "a 16-year-old pays the price for ages 16 to 64");
Check.True(SkiHill.PassPrice(40) == 48m, "a 40-year-old pays the price for ages 16 to 64");
Check.True(SkiHill.PassPrice(64) == 48m, "a 64-year-old still pays the price for ages 16 to 64");
Check.True(SkiHill.PassPrice(65) == 30m, "a 65-year-old pays the price for 65 and over");
Check.True(SkiHill.PassPrice(98) == 30m, "a 98-year-old pays the price for 65 and over");
