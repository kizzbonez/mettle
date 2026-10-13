//! LRU Page Cache
//!
//! A generic least-recently-used cache. Every operation except `iter` must
//! run in O(1) expected time.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::borrow::Borrow;
use std::collections::HashMap;
use std::hash::Hash;
use std::num::NonZeroUsize;

/// Counters exported to the metrics endpoint.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Stats {
    /// `get` and `get_mut` calls that found the key.
    pub hits: u64,
    /// `get` and `get_mut` calls that did not.
    pub misses: u64,
    /// Entries pushed out by `put` because the cache was full.
    pub evictions: u64,
}

/// A cache that holds at most `capacity` entries and evicts the least
/// recently used one when it is full.
pub struct LruCache<K, V> {
    capacity: usize,
    stats: Stats,
    // TODO 1: design the storage. This `Vec` only keeps the type parameters in
    //         use so that the starter compiles; a cache that scans it will be
    //         too slow. You need O(1) lookup by key, O(1) "move to the front"
    //         and O(1) "remove the oldest".
    entries: Vec<(K, V)>,
}

impl<K: Hash + Eq + Clone, V> LruCache<K, V> {
    /// Creates an empty cache that holds at most `capacity` entries.
    pub fn new(capacity: NonZeroUsize) -> Self {
        LruCache {
            capacity: capacity.get(),
            stats: Stats::default(),
            entries: Vec::new(),
        }
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }

    pub fn len(&self) -> usize {
        todo!("LruCache::len")
    }

    pub fn is_empty(&self) -> bool {
        todo!("LruCache::is_empty")
    }

    /// The counters so far.
    pub fn stats(&self) -> Stats {
        self.stats
    }

    /// Looks a key up, counts a hit or a miss, and makes a hit the most
    /// recently used entry.
    pub fn get<Q>(&mut self, key: &Q) -> Option<&V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        todo!("LruCache::get")
    }

    /// Like `get`, with a mutable reference to the value.
    pub fn get_mut<Q>(&mut self, key: &Q) -> Option<&mut V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        todo!("LruCache::get_mut")
    }

    /// Looks a key up without changing its position or the counters.
    pub fn peek<Q>(&self, key: &Q) -> Option<&V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        todo!("LruCache::peek")
    }

    /// Inserts or replaces an entry and makes it the most recently used.
    /// Returns the entry that left the cache: the replaced one, or the evicted
    /// least recently used one.
    pub fn put(&mut self, key: K, value: V) -> Option<(K, V)> {
        todo!("LruCache::put")
    }

    /// Removes an entry and returns its value.
    pub fn remove<Q>(&mut self, key: &Q) -> Option<V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        todo!("LruCache::remove")
    }

    /// Every entry, from the most to the least recently used.
    pub fn iter(&self) -> impl Iterator<Item = (&K, &V)> + '_ {
        // TODO 2: walk the entries in recency order. The empty iterator is a
        //         placeholder with the right type.
        std::iter::empty()
    }
}
