// This test calls your three methods, prints the gate number 4 itself, and
// compares everything printed with the screen from the instructions.
string printed = Printed.By(() =>
{
    FerryBoard.Welcome();
    FerryBoard.Sailings();
    FerryBoard.GateLabel();
    Console.WriteLine(4);
});

Console.WriteLine("Your methods and the gate number printed:");
Console.Write(printed);

// In the text below, \n marks the end of a line.
Check.Equal(printed,
    "Welcome to Harbour Quay!\n07:45 Gull Island\n09:30 Little Skerry\nBoard at gate 4\n",
    "the whole screen: welcome, sailings, then the gate label with 4 on the same line");
