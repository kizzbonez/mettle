Check.True(Laundromat.TryReadKilos("7", out int kilos) && kilos == 7, "a plain whole number is read");
Check.True(Laundromat.TryReadKilos("1", out kilos) && kilos == 1, "1 kg is the smallest amount that is accepted");
Check.True(!Laundromat.TryReadKilos("0", out kilos) && kilos == 0, "0 kg is refused, and kilos is 0");
Check.True(!Laundromat.TryReadKilos("-3", out kilos) && kilos == 0, "a negative number is refused, and kilos is 0 afterwards");
Check.True(!Laundromat.TryReadKilos("", out kilos) && kilos == 0, "an empty text is refused, and kilos is 0");
Check.True(!Laundromat.TryReadKilos("2.5", out kilos) && kilos == 0, "a number with a fractional part is refused, and kilos is 0");

decimal balance = 10.00m;
Check.True(Laundromat.PayWithCard(ref balance, 4.50m) && balance == 5.50m, "a payment that the card covers is subtracted from the caller's balance");
Check.True(Laundromat.PayWithCard(ref balance, 5.50m) && balance == 0m, "a payment of exactly the whole balance is allowed");
Check.True(!Laundromat.PayWithCard(ref balance, 0.01m) && balance == 0m, "an empty card refuses a payment and stays empty");

decimal small = 3.00m;
Check.True(!Laundromat.PayWithCard(ref small, 4.50m), "a payment larger than the balance is refused");
Check.True(small == 3.00m, "a refused payment leaves the caller's balance as it was");
