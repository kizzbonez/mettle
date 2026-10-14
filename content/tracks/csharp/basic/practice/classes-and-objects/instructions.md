Complete the class `VisitCard`. Keep every public name, parameter and type as it is, because the
tests create cards with `new` and use each member below. You add the private fields yourself.

1. Add a private field for the visits left on a card, and a private **static** field that
   counts the cards created so far. The static field is shared by every card; the other one
   belongs to each card on its own.
2. The constructor `VisitCard(string owner, int visits)` stores the owner and the visits, and
   gives the card its `Number`: the first card created is number 1, the next one 2, and so on.
3. `Issued` is the number of cards created so far, and `0` before any card exists. It is
   `static`, so it is read as `VisitCard.Issued`.
4. `VisitsLeft` is the number of visits left on the card.
5. `CheckIn()` takes one visit off the card and returns `true`. When no visit is left, it
   returns `false` and changes nothing.
6. `TopUp(int visits)` adds visits to the card.
7. `Describe()` returns one line in exactly this form, where the word is `visit` for exactly one
   visit and `visits` otherwise:

   ```text
   Card 1, Ada: 4 visits left, locker B7
   ```

`Locker` is already complete: it starts as `none`, and anyone may change it, also with an
object initializer.

Example:

```csharp
var ada = new VisitCard("Ada", 5) { Locker = "B7" };
var ben = new VisitCard("Ben", 1);
ada.Number          // 1
ben.Number          // 2
VisitCard.Issued    // 2
ben.Describe()      // "Card 2, Ben: 1 visit left, locker none"
ada.CheckIn()       // true
ada.VisitsLeft      // 4
ben.CheckIn()       // true
ben.CheckIn()       // false: no visit left
ben.TopUp(10);
ben.VisitsLeft      // 10
ada.Describe()      // "Card 1, Ada: 4 visits left, locker B7"
```

**Tip:** if the compiler warns CS1717, "Assignment made to same variable", a parameter and a
field share a name. Use `this.` or an `_` prefix, as the lesson shows.
