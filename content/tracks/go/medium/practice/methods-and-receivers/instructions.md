Complete `solution.go`. The types and the first line of every method are written for you, but
every method has a value receiver: task 4 is to fix the receivers that are wrong.

1. **`(t Ticket) String() string`** returns `C-` followed by the ticket number, padded with zeros
   to at least three digits: `C-007`, `C-042`, `C-1204`. **`(ts Tickets) String() string`**
   returns the tickets' own strings joined by `", "`, or `none` when the list is empty (or nil).
   Then `fmt.Println` prints both types this way by itself.
2. **`NewCloakroom(capacity int) *Cloakroom`** returns a new, empty cloakroom with `capacity`
   hooks, ready to use: a nil map cannot be written to, so make the map here.
3. The four cloakroom methods:
   - **`Check(coat string) (Ticket, bool)`** hangs up a coat and returns its ticket and `true`.
     Tickets are numbered 1, 2, 3 and so on in the order they are handed out, and a number is
     never handed out twice, even after its coat is collected. When every hook is taken, it
     returns `0, false` and hangs nothing up.
   - **`Collect(t Ticket) (string, bool)`** returns the coat for ticket `t` and frees its hook.
     For a ticket whose coat is not in the cloakroom (never handed out, or already collected) it
     returns `"", false`.
   - **`Free() int`** returns how many hooks are free.
   - **`Uncollected() Tickets`** returns the tickets whose coats are still hanging, lowest
     first.
4. **Receivers.** Give each method the receiver it should have. The cloakroom's methods must
   change the cloakroom the caller has, and the consistency rule from the lesson decides the
   ones that only read it. `Ticket` and `Tickets` are small values that are printed by value.

Example:

```go
room := NewCloakroom(2)
a, _ := room.Check("green parka")  // C-001, true
room.Check("red umbrella")         // C-002, true
room.Check("blue scarf")           // 0, false: both hooks are taken
room.Free()                        // 0
room.Collect(a)                    // "green parka", true
room.Collect(a)                    // "", false: already collected
room.Check("blue scarf")           // C-003, true: numbers are never reused
fmt.Println(a, room.Uncollected()) // prints: C-001 C-002, C-003
fmt.Println(Tickets{})             // prints: none
```
