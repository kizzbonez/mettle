Write the four exported functions. `VisitorLog`, `badge_text` and `visitor_log_new` are
written. Keep every signature, `extern "C"` and `#[unsafe(no_mangle)]` as they are. The tests
stand in for the C firmware: they hold only raw pointers and call your functions the way C
would.

1. `visitor_log_add(log: *mut VisitorLog, name: *const c_char) -> i32` adds one visitor and
   returns a status. Make the checks in this order:
   - `-1` if `log` or `name` is null;
   - `-2` if the name is not valid UTF-8;
   - `-3` if `badge_text(name)` panics, which it does for a blank name;
   - otherwise push the badge text onto `badges` and return `0`.

   A call that fails adds nothing. The name is only lent for the call, so keep no pointer to
   it.
2. `visitor_log_last(log: *const VisitorLog) -> *mut c_char` returns the badge of the latest
   visitor as a **new** C string that the caller owns. It returns a null pointer if `log` is
   null or has no visitor. The string must stay valid until the caller frees it, even if the
   log is freed first.
3. `visitor_badge_free(badge: *mut c_char)` frees a string that came from `visitor_log_last`.
   A null pointer is allowed and does nothing.
4. `visitor_log_free(log: *mut VisitorLog)` frees a log that came from `visitor_log_new`. A
   null pointer is allowed and does nothing.

Three rules from the lesson decide whether the tests pass:

- **A panic must not leave an exported function.** At the edge of an `extern "C"` function it
  aborts the whole process, and the kiosk with it. Until you replace a `todo!`, you will see
  exactly that abort.
- **Memory goes back to the allocator it came from.** What `CString::into_raw` gave away comes
  back through `CString::from_raw`, and what `Box::into_raw` gave away through `Box::from_raw`.
- **Nothing may be left behind.** One test counts the blocks of memory that are allocated and
  not yet freed. After every badge and the log have been freed, the count must be back where
  it started.

The tests cannot see undefined behaviour, so give each `unsafe` block a `// SAFETY:` comment
that says which line of the function's `# Safety` contract it relies on.

**Tip:** `catch_unwind` takes a closure that only reads what it captures, such as
`|| badge_text(name)`, as it is. A closure that captures the `&mut VisitorLog` needs
`AssertUnwindSafe` around it, and then you have to make sure yourself that a panic cannot
leave the log half changed.

Example:

```rust
use std::ffi::CStr;

let log = visitor_log_new();
unsafe {
    visitor_log_add(log, c" ada ".as_ptr());      // 0
    visitor_log_add(log, std::ptr::null());       // -1: no name
    visitor_log_add(log, c"  ".as_ptr());         // -3: badge_text panicked, nothing was added

    let badge = visitor_log_last(log);            // a new C string, owned by the caller
    CStr::from_ptr(badge).to_str();               // Ok("ADA")

    visitor_badge_free(badge);
    visitor_log_free(log);
}
```
