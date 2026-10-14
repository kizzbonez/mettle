// A waitlist of ints: the container must not assume strings.
var line = new Waitlist<int>();
Check.Equal(line.Count, 0, "a new waitlist is empty");
Check.Equal(line.PositionOf(7), 0, "PositionOf for a member who is not waiting");
Check.Throws<InvalidOperationException>(() => line.Next(), "Next on an empty waitlist");
Check.True(!line.Leave(7), "Leave for a member who is not waiting");

Check.True(line.Join(7), "Join for a new member");
Check.True(line.Join(3), "Join for a second new member");
Check.True(!line.Join(7), "Join for a member who is already waiting");
Check.Equal(line.Count, 2, "Count after a refused Join");
Check.True(line.Join(9), "Join for a third new member");
Check.SequenceEqual(line, new[] { 7, 3, 9 }, "members are listed in the order they joined");

Check.True(line.Leave(3), "Leave for a waiting member");
Check.True(!line.Leave(3), "Leave for a member who has already left");
Check.Equal(line.PositionOf(9), 2, "positions after a member in front leaves");
Check.Equal(line.Next(), 7, "Next serves the member who joined first");
Check.Equal(line.Count, 1, "Count after Next");
Check.Equal(line.PositionOf(7), 0, "a member served by Next is no longer waiting");
Check.True(line.Join(7), "a member served by Next can join again");
Check.SequenceEqual(line.ToList(), new[] { 9, 7 }, "a member who joins again goes to the back");
Check.Equal(line.Next(), 9, "Next after a member rejoined");
Check.Equal(line.Next(), 7, "Next serves the last member");
Check.Throws<InvalidOperationException>(() => line.Next(), "Next after the waitlist has been emptied");

// Tuple members: equality comes from the member type.
var requests = new Waitlist<(string Id, bool Suspended)>();
foreach (string id in new[] { "P1", "P2", "P3", "P4", "P5" })
{
    requests.Join((id, id is "P2" or "P4"));
}
Check.True(!requests.Join(("P3", false)), "Join for a value equal to one already waiting");
Check.Equal(requests.PositionOf(("P5", false)), 5, "PositionOf finds a member by value");

int removed = requests.RemoveAll(request => request.Suspended);
Check.Equal(removed, 2, "the number RemoveAll returns");
Check.SequenceEqual(requests.Select(request => request.Id), new[] { "P1", "P3", "P5" },
    "the members RemoveAll keeps, in order");
Check.Equal(requests.RemoveAll(request => request.Suspended), 0, "RemoveAll when nothing matches");
Check.Equal(requests.Count, 3, "Count after RemoveAll");
Check.True(requests.Join(("P2", true)), "a member removed by RemoveAll can join again");
Check.Equal(requests.PositionOf(("P2", true)), 4, "where a rejoining member is placed");
