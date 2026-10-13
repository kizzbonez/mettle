// Each line calls one of your functions and compares the result with the
// example in the instructions.
let borrowed = Loan::Borrowed { days_left: 3 };
let reserved = Loan::Reserved(String::from("R. Diaz"));

assert_eq!(status_line(&borrowed), "due in 3 days", "the line for a book with 3 days left");
assert_eq!(
    status_line(&Loan::Borrowed { days_left: 0 }),
    "due today",
    "the line for a book with 0 days left"
);
assert_eq!(status_line(&reserved), "held for R. Diaz", "the line for a book reserved for R. Diaz");

assert_eq!(late_fee(7), 50, "the fee for 7 days late");
assert_eq!(late_fee(8), 200, "the fee for 8 days late");

assert_eq!(remaining_days(&borrowed), Some(3), "the days left on a borrowed book");
assert_eq!(remaining_days(&Loan::OnShelf), None, "the days left on a book that is on the shelf");

assert_eq!(fee_due(&Loan::Overdue(12)), 200, "the fee due on a book that is 12 days late");
assert_eq!(fee_due(&Loan::OnShelf), 0, "the fee due on a book that is on the shelf");
