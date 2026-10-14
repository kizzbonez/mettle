var machine = new VendingMachine(2);
Check.Equal(machine.Credit, 0m, "the credit of a new machine");

// Every coin the machine takes.
machine.Insert(0.10m);
machine.Insert(0.20m);
machine.Insert(0.50m);
machine.Insert(1m);
machine.Insert(2m);
Check.Equal(machine.Credit, 3.80m, "the credit after one coin of every kind");
machine.Insert(0.1m);
machine.Insert(1.00m);
Check.Equal(machine.Credit, 4.90m, "0.1 is the same coin as 0.10, and 1.00 the same as 1");

// Everything else is refused, and the credit stays.
foreach (decimal coin in new[] { 0.05m, 0.01m, 0.30m, 5m, 0m, -1m, -0.50m, 1.5m })
{
    Check.Throws<ArgumentException>(() => machine.Insert(coin), $"inserting {coin}, which the machine does not take");
}
Check.Equal(machine.Credit, 4.90m, "refused coins leave the credit as it was");

// Refund
Check.Equal(machine.Refund(), 4.90m, "Refund hands back the whole credit");
Check.Equal(machine.Credit, 0m, "the credit after a refund");
Check.Equal(machine.Refund(), 0m, "a second refund hands back nothing");
machine.Insert(2m);
Check.Equal(machine.Credit, 2m, "coins inserted after a refund count from 0");

// Only the machine can change the credit.
var credit = typeof(VendingMachine).GetProperty(nameof(VendingMachine.Credit))!;
Check.True(credit.GetMethod is { IsPublic: true }, "outside code can read Credit");
Check.True(credit.SetMethod is null || !credit.SetMethod.IsPublic, "outside code cannot set Credit");
