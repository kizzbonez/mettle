The abstract base class `Room` is complete: do not change it. Its `BillLine()` asks the room for
its `Name` and its `Total()`, so every derived class gets the right bill line as long as it
**overrides** what it changes. The constructors already pass the number and the nights to
`base(...)`. Write the rest of the three derived classes, then `FrontDesk.Bill`.

1. **`Standard : Room`** costs `90` a night. Override `Name` so that it is `standard room`.
2. **`Suite : Room`** costs `210` a night and is called `suite`.
   - Its constructor stores `breakfast` in the property `Breakfast`.
   - Override `Total()`: with breakfast, the stay costs `18` more for every night. Build it on
     `base.Total()` instead of repeating the sum.
3. **`FamilyRoom : Standard`** is `sealed`. Its constructor stores `children` in `Children`.
   - Its nightly rate is the standard rate plus `15` for each child. Use `base.NightlyRate`, so
     that a change to the standard rate reaches family rooms too.
   - It is called `family room`.
4. **`FrontDesk.Bill(List<Room> rooms)`** is the total of all the rooms' stays. An empty list
   costs `0`.

Example:

```csharp
var standard = new Standard(101, 2);
var suite = new Suite(301, 3, breakfast: true);
var family = new FamilyRoom(205, 2, children: 2);

standard.NightlyRate                         // 90
suite.Total()                                // 684: 3 nights at 210, plus 3 breakfasts at 18
family.NightlyRate                           // 120: 90, plus 15 for each child

Room room = family;                          // a family room seen through a Room variable
room.BillLine()                              // "Room 205, family room, 2 nights: 240.00"

FrontDesk.Bill([standard, suite, family])    // 1104: 180 + 684 + 240
```
