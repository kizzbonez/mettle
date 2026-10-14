A dental clinic's appointment-reminder service runs on a small box in the back office and is
built from a single project with no packages. Its start-up code has grown to three hundred lines
of `new`, and last week a database session opened for one request was still being used by the
next.
