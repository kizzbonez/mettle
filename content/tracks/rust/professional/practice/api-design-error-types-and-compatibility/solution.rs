//! Parcel SDK
//!
//! The public surface of a courier's shipping library, shaped so that a later
//! version can add to it without breaking the shops that already use it.

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
        let digits = text.strip_prefix("PX")?;
        if digits.len() == 6 && digits.bytes().all(|byte| byte.is_ascii_digit()) {
            Some(TrackingCode(text.to_string()))
        } else {
            None
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Lets a map with `TrackingCode` keys be searched with a `&str`. The derived
/// `Hash` and `Eq` only look at the inner `String`, so the borrowed form
/// hashes and compares exactly like the owned one, as `Borrow` requires.
impl Borrow<str> for TrackingCode {
    fn borrow(&self) -> &str {
        &self.0
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
        ParcelBuilder {
            recipient: recipient.into(),
            weight,
            service: Service::default(),
            insured_cents: 0,
            note: None,
        }
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
    recipient: String,
    weight: NonZeroU32,
    service: Service,
    insured_cents: u32,
    note: Option<String>,
}

impl ParcelBuilder {
    pub fn service(mut self, service: Service) -> Self {
        self.service = service;
        self
    }

    pub fn insured_cents(mut self, cents: u32) -> Self {
        self.insured_cents = cents;
        self
    }

    pub fn note(mut self, note: impl Into<String>) -> Self {
        self.note = Some(note.into());
        self
    }

    pub fn build(self) -> Parcel {
        Parcel {
            recipient: self.recipient,
            weight: self.weight,
            service: self.service,
            insured_cents: self.insured_cents,
            note: self.note,
        }
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
        self.parcels.insert(code, parcel)
    }

    /// Accepts any borrowed form of the code, as `HashMap::get` does.
    pub fn get<Q>(&self, code: &Q) -> Option<&Parcel>
    where
        TrackingCode: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        self.parcels.get(code)
    }
}
