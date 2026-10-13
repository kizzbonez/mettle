//! Moving Day
//!
//! One generic function and one generic struct for a removal firm. Each is
//! written once and works for names, for weights and for any other type.

/// The largest item of a slice, or `None` if the slice is empty.
pub fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    if items.is_empty() {
        return None;
    }
    let mut largest = &items[0];
    for item in items {
        // Strictly greater, so the first of several equal items is kept.
        if item > largest {
            largest = item;
        }
    }
    Some(largest)
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
        Carton { label: label.to_string(), items: Vec::new() }
    }

    /// What is written on the carton.
    pub fn label(&self) -> &str {
        &self.label
    }

    /// Puts one more item in, after the ones already there.
    pub fn pack(&mut self, item: T) {
        self.items.push(item);
    }

    /// The contents, in the order they were packed.
    pub fn items(&self) -> &[T] {
        &self.items
    }

    /// The same carton with new contents. `U` belongs to this method only,
    /// so the new items may be of another type.
    pub fn repack<U>(self, items: Vec<U>) -> Carton<U> {
        Carton { label: self.label, items }
    }
}

// Only a carton of weights in kilograms gets this method.
impl Carton<f64> {
    /// The sum of the weights.
    pub fn total_kg(&self) -> f64 {
        let mut total = 0.0;
        for weight in &self.items {
            total += weight;
        }
        total
    }
}
