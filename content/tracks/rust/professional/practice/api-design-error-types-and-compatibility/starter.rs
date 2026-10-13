//! Parcel SDK
//!
//! The public surface of a courier's shipping library, shaped so that a later
//! version can add to it without breaking the shops that already use it.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::borrow::Borrow;
use std::collections::HashMap;
use std::hash::Hash;
use std::num::NonZeroU32;

/// A tracking code: the letters `PX` followed by six digits, as in `PX004217`.
///
/// The field is private and `parse` is the only way in, so a `TrackingCode`
/// that exists is valid and no function that takes one has to check it.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct TrackingCode(String);

impl TrackingCode {
    /// Accepts exactly `PX` and six ASCII digits. Anything else is `None`.
    pub fn parse(text: &str) -> Option<TrackingCode> {
        // TODO 1: check the prefix and the six digits, then wrap the text
        todo!("TrackingCode::parse")
    }

    pub fn as_str(&self) -> &str {
        todo!("TrackingCode::as_str")
    }
}

/// Lets a map with `TrackingCode` keys be searched with a `&str`.
impl Borrow<str> for TrackingCode {
    fn borrow(&self) -> &str {
        todo!("Borrow<str> for TrackingCode")
    }
}

/// How fast a parcel travels. `#[non_exhaustive]` makes other crates write a
/// wildcard arm, so a third service can arrive in a minor release.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
#[non_exhaustive]
pub enum Service {
    #[default]
    Standard,
    Express,
}

/// A parcel that is ready to ship. The fields are private and every parcel
/// comes from `Parcel::builder`, so a new setting is one new builder method.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Parcel {
    recipient: String,
    weight: NonZeroU32,
    service: Service,
    insured_cents: u32,
    note: Option<String>,
}

impl Parcel {
    /// Starts a builder with the two required settings. The weight is in
    /// grams and cannot be zero.
    pub fn builder(recipient: impl Into<String>, weight: NonZeroU32) -> ParcelBuilder {
        // TODO 2: store the required settings and the default of every other
        todo!("Parcel::builder")
    }

    pub fn recipient(&self) -> &str {
        &self.recipient
    }

    pub fn weight(&self) -> NonZeroU32 {
        self.weight
    }

    pub fn service(&self) -> Service {
        self.service
    }

    pub fn insured_cents(&self) -> u32 {
        self.insured_cents
    }

    pub fn note(&self) -> Option<&str> {
        self.note.as_deref()
    }
}

/// Gathers the settings of a parcel by name and supplies the defaults.
#[derive(Debug, Clone)]
pub struct ParcelBuilder {
    // TODO 2: one private field for every setting of a `Parcel`.
}

impl ParcelBuilder {
    pub fn service(mut self, service: Service) -> Self {
        todo!("ParcelBuilder::service")
    }

    pub fn insured_cents(mut self, cents: u32) -> Self {
        todo!("ParcelBuilder::insured_cents")
    }

    pub fn note(mut self, note: impl Into<String>) -> Self {
        todo!("ParcelBuilder::note")
    }

    pub fn build(self) -> Parcel {
        todo!("ParcelBuilder::build")
    }
}

/// The parcels of one pickup, by tracking code.
#[derive(Debug, Default)]
pub struct Manifest {
    parcels: HashMap<TrackingCode, Parcel>,
}

impl Manifest {
    pub fn new() -> Self {
        Manifest::default()
    }

    pub fn len(&self) -> usize {
        self.parcels.len()
    }

    /// Stores a parcel under its code and hands back the parcel it replaced,
    /// so that nothing is dropped behind the caller's back.
    pub fn add(&mut self, code: TrackingCode, parcel: Parcel) -> Option<Parcel> {
        // TODO 3: `HashMap` already returns what the caller would lose
        todo!("Manifest::add")
    }

    /// Accepts any borrowed form of the code, as `HashMap::get` does.
    pub fn get<Q>(&self, code: &Q) -> Option<&Parcel>
    where
        TrackingCode: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        todo!("Manifest::get")
    }
}
