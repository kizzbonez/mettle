let reserved = Loan::Reserved(String::from("Ada"));

// remaining_days: Some only for Borrowed.
assert!(
    remaining_days(&Loan::Borrowed { days_left: 14 }) == Some(14),
    "a borrowed book answers with its days left inside Some"
);
assert!(
    remaining_days(&Loan::Borrowed { days_left: 0 }) == Some(0),
    "a book that is due today is still borrowed, so the answer is Some with zero inside"
);
assert!(remaining_days(&Loan::OnShelf) == None, "a book on the shelf has no days left to report");
assert!(
    remaining_days(&Loan::Overdue(5)) == None,
    "an overdue book has no days left, and its days late are not days left"
);
assert!(remaining_days(&reserved) == None, "a reserved book has no days left to report");

// fee_due: the late fee only for Overdue.
assert!(fee_due(&Loan::Overdue(3)) == 50, "an overdue book is charged the late fee for its days");
assert!(fee_due(&Loan::Overdue(30)) == 200, "the fee due follows the ranges of late_fee");
assert!(fee_due(&Loan::Overdue(31)) == 500, "the fee due reaches the highest late fee");
assert!(fee_due(&Loan::Overdue(0)) == 0, "an overdue book with 0 days late owes nothing");
assert!(
    fee_due(&Loan::Borrowed { days_left: 12 }) == 0,
    "a borrowed book owes nothing, and its days left are not days late"
);
assert!(fee_due(&Loan::OnShelf) == 0, "a book on the shelf owes nothing");
assert!(fee_due(&reserved) == 0, "a reserved book owes nothing");
