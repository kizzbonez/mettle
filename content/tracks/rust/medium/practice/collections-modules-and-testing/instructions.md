In this lab you write the tests, not the code they test. `fleet::buses_needed` in the starter
is finished and correct, and the module `faulty` holds three versions of it with one bug each.
Leave both modules as they are.

The sandbox cannot run `#[test]` functions, so each test here is an ordinary `pub fn` that
receives the function to test as its parameter `buses_needed`. In every other way it is a test:
it calls the function, and it fails by panicking, which is what `assert!` and `assert_eq!` do
when a check does not hold. Give every assertion a message that says what was being checked.

What `buses_needed(passengers, seats)` promises:

- With 0 `seats` it returns an `Err`. The wording of the message is not part of the promise.
- Otherwise it returns `Ok` with the smallest number of buses that seats everyone: no bus for
  no passengers, exactly enough when the passengers fill the buses, and one bus more as soon
  as anyone is left over.

Write three tests.

1. `test_full_buses` is the happy path. Assert both of these cases:
   - the passengers fill one bus exactly, such as 40 passengers with 40 seats;
   - the passengers fill several buses exactly, such as 120 passengers with 40 seats.
2. `test_last_bus` is about the boundary. Assert both of these cases:
   - one passenger more than the full buses hold, such as 41 passengers with 40 seats;
   - a group smaller than one bus, such as 5 passengers with 40 seats.
3. `test_edge_cases` returns `Result<(), String>`, the other way to write a test. It fails by
   returning an `Err` as well as by panicking.
   - Get the number of buses for no passengers with `?`, and assert that it is 0.
   - Assert that 0 seats give an error. Use `is_err()` and do not look at the message.
   - Finish with `Ok(())`.

How your work is judged:

- Every test must pass when it is given a correct `buses_needed`. The hidden tests use
  correct versions of their own, with another error message than the one in the starter.
- Every test must fail when it is given a version that gets one of the cases listed for that
  test wrong. The three versions in `faulty` are examples, and the hidden tests bring more.

Example:

```rust
test_full_buses(fleet::buses_needed);            // returns: the test passed
test_last_bus(fleet::buses_needed);              // returns: the test passed
test_edge_cases(fleet::buses_needed)             // Ok(()): the test passed

test_full_buses(faulty::always_one_extra);       // panics: the test caught the bug
test_last_bus(faulty::leaves_people_behind);     // panics: the test caught the bug
test_edge_cases(faulty::accepts_no_seats)        // panics: the test caught the bug
```

In a real project the three would be `#[test]` functions in a `#[cfg(test)] mod tests`, and
`cargo test` would run them.
