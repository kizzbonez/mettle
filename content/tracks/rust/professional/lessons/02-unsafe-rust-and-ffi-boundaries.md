---
title: "FFI: Calling C and Being Called by C"
summary: Declare C functions in `unsafe extern` blocks, pass strings and structs across the boundary, decide who frees what, and export Rust functions that never unwind into C.
minutes: 30
objectives:
  - Declare a C function in an `unsafe extern "C"` block and wrap it in a safe function
  - Convert between Rust strings and C strings with `CString` and `CStr`
  - State, for a pointer that crosses the boundary, which side owns the memory and which side frees it
  - Export a function with `#[unsafe(no_mangle)]` that turns a panic into an error code
---

## Outline

1. Declaring foreign functions
2. Strings: `CString` and `CStr`
3. Layout and ownership
4. Being called by C
5. Panics at the boundary

## Declaring foreign functions

A **foreign function interface** (FFI) lets one language call another. C is the common
ground, because nearly every language can speak its **ABI** (application binary interface):
the rules for placing arguments, return values and struct fields in registers and memory.

Rust cannot read C code, so you describe each function in an `extern` block. That description
is a promise nobody checks. A wrong parameter type compiles and is undefined behaviour when
called, which is why the 2024 edition makes you write `unsafe extern`. Inside the block a
function is unsafe to call unless you mark it `safe`, vouching once that no argument can
misbehave. Use the aliases in `std::ffi` (`c_int`, `c_char`, `c_void`): C's `int` and `char`
differ between platforms.

```rust
use std::ffi::{CStr, CString, c_char, c_int};

// The C standard library is already linked into every Rust program.
unsafe extern "C" {
    // `abs` has no preconditions, so we vouch for it once, here.
    safe fn abs(value: c_int) -> c_int;
    // `strlen` reads until it finds a NUL byte: the caller must supply one.
    fn strlen(text: *const c_char) -> usize;
}

/// `&CStr` is always NUL-terminated, so this wrapper cannot be misused.
pub fn c_length(text: &CStr) -> usize {
    // SAFETY: `text` is valid and NUL-terminated for the whole call, and
    // `strlen` only reads.
    unsafe { strlen(text.as_ptr()) }
}

fn main() {
    println!("{}", abs(-42));

    let owned = CString::new("mettle").expect("no NUL byte inside");
    println!("{} {}", c_length(&owned), c_length(c"lab"));

    println!("{}", CString::new("a\0b").is_err());
}
```

```text
42
6 3
true
```

`c_length` is the shape of every binding: an unsafe declaration, then a safe wrapper whose
parameter types make misuse impossible.

## Strings: `CString` and `CStr`

A C string is a pointer to bytes that ends at the first zero byte (NUL). A Rust `&str` carries
a length and has no terminator, so handing `text.as_ptr()` to C is a bug. Two types bridge the
gap:

- `CString` **owns** a NUL-terminated buffer. `CString::new` fails if the text contains a
  zero byte, as the last line above shows.
- `&CStr` **borrows** one, as `&str` borrows from a `String`. The literal `c"lab"` is a
  `&'static CStr`.

In the other direction, `CStr::from_ptr` wraps a pointer you were given (unsafe: you promise
it is valid and terminated). `to_str` then checks that the bytes are UTF-8, and
`to_string_lossy` replaces the ones that are not.

## Layout and ownership

Rust may reorder a struct's fields. `#[repr(C)]` fixes the layout to the one a C compiler
uses, so every struct that crosses the boundary needs it.

The second question is always **who frees this**. Rust and C use different allocators, and
memory must go back to the one it came from.

```rust
use std::ffi::{CStr, c_char, c_int, c_void};

/// Mirrors C's `div_t`. Without `repr(C)` the field order is unspecified.
#[repr(C)]
#[derive(Debug)]
pub struct DivResult {
    quot: c_int,
    rem: c_int,
}

unsafe extern "C" {
    fn div(numerator: c_int, denominator: c_int) -> DivResult;
    fn strdup(text: *const c_char) -> *mut c_char; // C allocates the copy
    fn free(pointer: *mut c_void);
}

fn main() {
    // SAFETY: the denominator is not zero and the quotient fits in an `int`.
    println!("{:?}", unsafe { div(17, 5) });

    // SAFETY: the argument is a valid C string.
    let copy = unsafe { strdup(c"from C".as_ptr()) };
    assert!(!copy.is_null(), "strdup ran out of memory");
    // SAFETY: `copy` is non-null and NUL-terminated. `into_owned` copies the
    // bytes to Rust's heap, so `text` does not depend on `copy` afterwards.
    let text = unsafe { CStr::from_ptr(copy) }.to_string_lossy().into_owned();
    // SAFETY: `copy` came from C's allocator and is not used again.
    unsafe { free(copy.cast()) };
    println!("{text}");
}
```

```text
DivResult { quot: 3, rem: 2 }
from C
```

Three cases cover most pointers:

- `c_string.as_ptr()` **lends**. C may read during the call, and the pointer dies with the
  `CString`.
- `c_string.into_raw()` **gives** the buffer to C. It must come back through
  `CString::from_raw`, never C's `free`. `Box::into_raw` and `Box::from_raw` do the same for
  any other value.
- Memory C allocated goes back to C: `free`, or the library's own destroy function.

## Being called by C

To export a function, give it C's calling convention with `extern "C"` and stop the compiler
renaming it with `#[unsafe(no_mangle)]`. The attribute is unsafe because two symbols with one
name can silently replace each other. A Rust value that C keeps travels as an **opaque
handle**: a pointer C never looks inside.

```rust
use std::panic::{AssertUnwindSafe, catch_unwind};

pub struct Counter {
    total: u64,
}

/// Creates a counter. The caller owns it and must pass it to `counter_free`.
#[unsafe(no_mangle)]
pub extern "C" fn counter_new() -> *mut Counter {
    Box::into_raw(Box::new(Counter { total: 0 }))
}

/// Adds `amount`. Returns 0 on success, -1 for a null handle or a panic.
///
/// # Safety
///
/// `handle` must be null or a live pointer from `counter_new`, and no other
/// thread may be using it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn counter_add(handle: *mut Counter, amount: u64) -> i32 {
    // SAFETY: per the contract, a non-null `handle` points to a live Counter.
    let Some(counter) = (unsafe { handle.as_mut() }) else {
        return -1;
    };
    let outcome = catch_unwind(AssertUnwindSafe(|| {
        counter.total = counter.total.checked_add(amount).expect("counter overflow");
    }));
    if outcome.is_ok() { 0 } else { -1 }
}

/// # Safety
///
/// `handle` must come from `counter_new` and must not be used afterwards.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn counter_free(handle: *mut Counter) {
    if !handle.is_null() {
        // SAFETY: the pointer came from `Box::into_raw` and is freed once.
        drop(unsafe { Box::from_raw(handle) });
    }
}

fn main() {
    let handle = counter_new(); // Rust standing in for the C caller
    // SAFETY: `handle` is live until `counter_free` and stays on this thread.
    unsafe {
        println!("{}", counter_add(handle, 5));
        println!("{}", counter_add(handle, u64::MAX));
        println!("{}", counter_add(std::ptr::null_mut(), 1));
        counter_free(handle);
    }
}
```

```text
0
-1
-1
```

The second call also prints the panic message `counter overflow` on standard error. Built
with `crate-type = ["cdylib"]` under `[lib]` in `Cargo.toml`, the library is used from C
through these declarations:

```c
typedef struct Counter Counter;
Counter *counter_new(void);
int32_t counter_add(Counter *handle, uint64_t amount);
void counter_free(Counter *handle);
```

## Panics at the boundary

A panic unwinds the stack, and the `"C"` ABI does not allow unwinding through it. A panic
that reaches the edge of an `extern "C"` function therefore **aborts the process**. That is
defined behaviour, but it kills the host application. An exported function that can panic should catch the panic
with `catch_unwind` and return an error code, as `counter_add` does. `AssertUnwindSafe` is
our claim that a panic leaves `counter` consistent: its only write happens after the check.

`catch_unwind` works only when panics unwind. With `panic = "abort"` there is nothing to
catch. The `"C-unwind"` ABI exists for the rare case where unwinding across the boundary is
intended.

## Common mistakes

- **`CString::new(s).unwrap().as_ptr()`.** The temporary `CString` is freed at the end of the
  statement, so the pointer dangles. Bind the `CString` to a variable first.
- **Passing `str::as_ptr()` to C.** There is no NUL, so C reads past the end.
- **Freeing with the wrong allocator**, in either direction.
- **A struct without `#[repr(C)]`**, or a declaration whose types differ from the header.
- **Using a handle after freeing it.** No type prevents it, so `# Safety` must forbid it.

## Practice

1. What is wrong with `fn greet(name: &str) { unsafe { puts(name.as_ptr().cast()) }; }`, where
   `puts` is C's `int puts(const char *)`? Repair it.
2. Export `label_new(id: u32) -> *mut c_char`, which returns the text `item-<id>`, and the
   function that releases it.
3. An exported `extern "C" fn half(value: i32) -> i32` begins with
   `assert!(value % 2 == 0)`. What happens when C passes 3? Redesign it to report the failure.

### Answers

1. `name` has no NUL terminator, so `puts` reads past the end of the string. Build a
   `CString` and keep it alive across the call:

   ```rust
   fn greet(name: &str) -> Result<(), std::ffi::NulError> {
       let name = CString::new(name)?;
       // SAFETY: `name` is a valid C string that outlives the call.
       unsafe { puts(name.as_ptr()) };
       Ok(())
   }
   ```

2. Rust allocates, so Rust frees:

   ```rust
   #[unsafe(no_mangle)]
   pub extern "C" fn label_new(id: u32) -> *mut c_char {
       CString::new(format!("item-{id}")).expect("digits contain no NUL").into_raw()
   }

   /// # Safety
   ///
   /// `label` must be null or an unfreed pointer from `label_new`.
   #[unsafe(no_mangle)]
   pub unsafe extern "C" fn label_free(label: *mut c_char) {
       if !label.is_null() {
           // SAFETY: the pointer came from `CString::into_raw`, reclaimed once.
           drop(unsafe { CString::from_raw(label) });
       }
   }
   ```

3. The assertion panics, the panic reaches the `extern "C"` edge, and the process aborts.
   Return a status and write the result through a pointer:
   `unsafe extern "C" fn half(value: i32, out: *mut i32) -> i32` returns -1 for an odd value
   or a null `out`, and otherwise writes `value / 2` with `out.write(...)` and returns 0.

## Key takeaways

- An `unsafe extern` block is an unchecked promise. Wrap it in a safe function whose types
  cannot be misused.
- `CString` owns, `&CStr` borrows, and neither is a `&str`.
- `#[repr(C)]` for shared structs, and memory returns to the allocator it came from.
- Exported functions use `extern "C"`, `#[unsafe(no_mangle)]` and opaque handles.
- A panic must not reach C. Catch it and return an error code, or accept an abort.

## Further reading

- [The Rust Reference: External blocks](https://doc.rust-lang.org/reference/items/external-blocks.html)
- [The Rustonomicon: Foreign Function Interface](https://doc.rust-lang.org/nomicon/ffi.html)
- [Standard library: `CString`](https://doc.rust-lang.org/std/ffi/struct.CString.html)
- [The Rust Programming Language: Unsafe Rust](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html)
