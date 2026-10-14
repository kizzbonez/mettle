// This test runs your Report method, shows you what it printed, and compares
// that with the line from the instructions.
string printed = Printed.By(() => Honey.Report());

Console.WriteLine("Your program printed:");
Console.Write(printed);

Check.Equal(printed.TrimEnd(), "4 hives gave 12.5 kg of honey", "the line the program prints for four hives");
