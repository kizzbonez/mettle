The Riverside branch library lends books, DVDs and magazines to about four thousand members.
Its loans desk still runs on a spreadsheet, and the spreadsheet is losing: fines are worked out
by hand, the waiting list for popular DVDs lives on sticky notes, and nobody can say at a glance
how many items are out.

Each loan is already exported as a small record:

```text
member M02 (child)  DVD       due 2026-03-07  not yet returned
member M01 (adult)  book      due 2026-03-01  returned 2026-03-06
```

You are writing the core of the replacement service, as plain C# that the web front end will
call. It has three parts. The **fine rules** turn one loan into an amount owed. A **waitlist**
keeps members in the order they reserved a title; the library will use it for DVDs, for
inter-library requests keyed by tuples, and for whatever comes next, so it must be generic. The
**reports** answer the questions the desk asks every morning: what is overdue, who owes what,
and how many items of each kind are out.

The loans come from a database cursor that can be read only once, so the reports must not read
their input twice.
