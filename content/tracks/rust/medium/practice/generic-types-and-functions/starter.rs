//! Moving Day
//!
//! One generic function and one generic struct for a removal firm. Each is
//! written once and works for names, for weights and for any other type.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The largest item of a slice, or `None` if the slice is empty.
// TODO 1: the body compares items, and not every type can be compared.
// Give `T` the bound that the comparison needs.
pub fn largest<T>(items: &[T]) -> Option<&T> {
    todo!("largest")
}

/// A labelled carton that holds items of one type.
pub struct Carton<T> {
    label: String,
    items: Vec<T>,
}

// These methods exist for a carton of every type.
impl<T> Carton<T> {
    /// An empty carton.
    pub fn new(label: &str) -> Carton<T> {
        todo!("Carton::new")
    }

    /// What is written on the carton.
    pub fn label(&self) -> &str {
        todo!("label")
    }

    /// Puts one more item in, after the ones already there.
    pub fn pack(&mut self, item: T) {
        todo!("pack")
    }

    /// The contents, in the order they were packed.
    pub fn items(&self) -> &[T] {
        todo!("items")
    }

    /// The same carton with new contents. `U` belongs to this method only,
    /// so the new items may be of another type.
    pub fn repack<U>(self, items: Vec<U>) -> Carton<U> {
        todo!("repack")
    }
}

// Only a carton of weights in kilograms gets this method.
impl Carton<f64> {
    /// The sum of the weights.
    pub fn total_kg(&self) -> f64 {
        todo!("total_kg")
    }
}
