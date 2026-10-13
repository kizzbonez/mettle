The `Loan` enum is declared in the starter. Do not change it or its `derive` line: the tests
build its variants. Write the four functions.

1. `status_line(loan: &Loan) -> String` describes a loan. `N` stands for the number inside the
   variant and `NAME` for the text inside it.
   - `Loan::OnShelf` is `on the shelf`.
   - `Loan::Borrowed` with 0 days left is `due today`.
   - `Loan::Borrowed` with any other number is `due in N days`. There is no special wording
     for one day: it is `due in 1 days`.
   - `Loan::Overdue(days)` is `N days late`, whatever the number.
   - `Loan::Reserved(name)` is `held for NAME`.
2. `late_fee(days_late: u32) -> u32` is a fee in cents: `0` for 0 days, `50` for 1 to 7 days,
   `200` for 8 to 30 days, and `500` for anything longer.
3. `remaining_days(loan: &Loan) -> Option<u32>` is `Some` with the days left when the loan is
   `Borrowed`, and `None` for every other variant.
4. `fee_due(loan: &Loan) -> u32` is the `late_fee` for the days of an `Overdue` loan, and `0`
   for every other variant.

Example:

```rust
status_line(&Loan::Borrowed { days_left: 3 })           // "due in 3 days"
status_line(&Loan::Borrowed { days_left: 0 })           // "due today"
status_line(&Loan::Reserved(String::from("R. Diaz")))   // "held for R. Diaz"
late_fee(7)                                             // 50
late_fee(8)                                             // 200
remaining_days(&Loan::Borrowed { days_left: 3 })        // Some(3)
remaining_days(&Loan::OnShelf)                          // None
fee_due(&Loan::Overdue(12))                             // 200
fee_due(&Loan::OnShelf)                                 // 0
```

**Tip:** the functions receive a `&Loan`, so a name bound by a pattern is a reference. Where
you need the number itself, write `*` in front of the name, as the lesson does with `*truck`.
