// The example from the instructions, with an optional argument left out and
// given by name, an out argument, and a balance passed with ref.
Check.Equal(Laundromat.WashersNeeded(20), 3, "the washers that 20 kg need with the default capacity of 8 kg");
Check.Equal(Laundromat.WashersNeeded(20, capacity: 10), 2, "the washers that 20 kg need when each takes 10 kg");
Check.Equal(Laundromat.Price(3), 13.50m, "the price of 3 washers without drying");
Check.Equal(Laundromat.Price(3, dry: true), 19.50m, "the price of 3 washers with drying");

Check.Equal(Laundromat.TryReadKilos(" 12 ", out int kilos), true, "whether \" 12 \" is read as a number of kilograms");
Check.Equal(kilos, 12, "the kilograms read from \" 12 \"");
Check.Equal(Laundromat.TryReadKilos("lots", out kilos), false, "whether \"lots\" is read as a number of kilograms");
Check.Equal(kilos, 0, "the kilograms after \"lots\" could not be read");

decimal balance = 20.00m;
Check.Equal(Laundromat.PayWithCard(ref balance, 13.50m), true, "whether a card with 20.00 pays 13.50");
Check.Equal(balance, 6.50m, "the balance after paying 13.50 from 20.00");
Check.Equal(Laundromat.PayWithCard(ref balance, 13.50m), false, "whether a card with 6.50 pays 13.50");
Check.Equal(balance, 6.50m, "the balance after a payment that was refused");
