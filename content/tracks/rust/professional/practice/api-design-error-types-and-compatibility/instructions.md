The public items and their signatures are in the starter, and they are the promise the SDK
makes to its users: keep them as they are. `Service`, `Parcel` with its getters, and the
`Manifest` struct are written. You write the three parts below.

1. **A newtype that carries a rule.** A tracking code is the letters `PX` followed by exactly
   six ASCII digits, as in `PX004217`.
   - `TrackingCode::parse(text: &str) -> Option<TrackingCode>` returns the code for such a
     text and `None` for anything else. The text is not trimmed and its case is not changed.
   - `as_str(&self) -> &str` returns the text.
   - `impl Borrow<str> for TrackingCode` returns the same text, so that a map with
     `TrackingCode` keys can be searched with a `&str`.
2. **A builder.** Give `ParcelBuilder` its private fields, then write:
   - `Parcel::builder(recipient: impl Into<String>, weight: NonZeroU32) -> ParcelBuilder`,
     which takes the two required settings. The defaults of the others are
     `Service::Standard`, an insured value of `0` cents and no note.
   - `service(self, service: Service) -> Self`, `insured_cents(self, cents: u32) -> Self` and
     `note(self, note: impl Into<String>) -> Self`, which each store one setting. If a
     setting is given twice, the last value wins.
   - `build(self) -> Parcel`.
3. **A manifest that loses nothing and lets lookups borrow.**
   - `add(&mut self, code: TrackingCode, parcel: Parcel) -> Option<Parcel>` stores the parcel
     under the code. If the code already had a parcel, the new one replaces it and the old
     one is returned.
   - `get<Q>(&self, code: &Q) -> Option<&Parcel>` finds a parcel by any borrowed form of the
     code: a `&TrackingCode` or a `&str`.

The shape is what keeps version 1.0 open for later additions. `Parcel` has private fields and
is created only through its builder, so a new setting is one new method with a default.
`Service` is `#[non_exhaustive]`, so a third service breaks nobody's `match`. The tests are
compiled into the same crate as your code, where that attribute has no effect, so they cannot
check it. Leave it in place.

Example:

```rust
use std::num::NonZeroU32;

let weight = NonZeroU32::new(750).unwrap();

let parcel = Parcel::builder("Ada Lovelace", weight).build();
parcel.service()                           // Service::Standard
parcel.insured_cents()                     // 0
parcel.note()                              // None

let express = Parcel::builder(String::from("Lin"), weight)
    .service(Service::Express)
    .insured_cents(20_000)
    .note("ring twice")
    .build();
express.note()                             // Some("ring twice")

TrackingCode::parse("px-4217")             // None
let code = TrackingCode::parse("PX004217").unwrap();
code.as_str()                              // "PX004217"

let mut manifest = Manifest::new();
manifest.add(code.clone(), parcel.clone()) // None: the code is new
manifest.add(code, express.clone())        // Some(parcel): the parcel it replaced
manifest.get("PX004217")                   // Some(&express), found with a &str
```
