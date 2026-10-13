assert!(status_line(&Loan::OnShelf) == "on the shelf", "the line for a book on the shelf");

assert!(
    status_line(&Loan::Borrowed { days_left: 0 }) == "due today",
    "a borrowed book with 0 days left has its own wording"
);
assert!(
    status_line(&Loan::Borrowed { days_left: 1 }) == "due in 1 days",
    "one day left has no special wording"
);
assert!(
    status_line(&Loan::Borrowed { days_left: 21 }) == "due in 21 days",
    "the number inside Borrowed is put into the line"
);

assert!(
    status_line(&Loan::Overdue(4)) == "4 days late",
    "the number inside Overdue is put into the line"
);
assert!(
    status_line(&Loan::Overdue(0)) == "0 days late",
    "the special wording for 0 belongs to Borrowed only, not to Overdue"
);

assert!(
    status_line(&Loan::Reserved(String::from("Ada"))) == "held for Ada",
    "the name inside Reserved is put into the line"
);
assert!(
    status_line(&Loan::Reserved(String::from("the school on Mill Road")))
        == "held for the school on Mill Road",
    "a name of several words is used whole"
);

// The loan was only borrowed, so it can be described again.
let loan = Loan::Reserved(String::from("Lin"));
assert!(
    status_line(&loan) == "held for Lin" && loan == Loan::Reserved(String::from("Lin")),
    "describing a loan leaves it unchanged"
);
