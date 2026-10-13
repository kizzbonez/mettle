//! LRU Page Cache: reference solution.
//!
//! A hash map finds an entry in O(1). A doubly linked list keeps the entries
//! in recency order, so "use" and "evict the oldest" are O(1) as well. The
//! list lives in a `Vec` and links its nodes with indices instead of pointers:
//! no `unsafe`, one allocation for all nodes, and good locality.

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

/// "No node": the `prev` of the head and the `next` of the tail.
const NIL: usize = usize::MAX;

struct Node<K, V> {
    key: K,
    value: V,
    /// Towards the most recently used end.
    prev: usize,
    /// Towards the least recently used end.
    next: usize,
}

/// A cache that holds at most `capacity` entries and evicts the least
/// recently used one when it is full.
pub struct LruCache<K, V> {
    capacity: usize,
    stats: Stats,
    /// Key to position in `nodes`.
    index: HashMap<K, usize>,
    /// Dense: every element is a live entry, so `nodes.len()` is the length
    /// of the cache and no slot needs an `Option`.
    nodes: Vec<Node<K, V>>,
    /// Most recently used node, or `NIL` when empty.
    head: usize,
    /// Least recently used node, or `NIL` when empty.
    tail: usize,
}

impl<K: Hash + Eq + Clone, V> LruCache<K, V> {
    /// Creates an empty cache that holds at most `capacity` entries.
    pub fn new(capacity: NonZeroUsize) -> Self {
        LruCache {
            capacity: capacity.get(),
            stats: Stats::default(),
            // Grown on demand rather than reserved up front: a large capacity
            // is a limit, not a promise that the cache will fill.
            index: HashMap::new(),
            nodes: Vec::new(),
            head: NIL,
            tail: NIL,
        }
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }

    pub fn len(&self) -> usize {
        self.nodes.len()
    }

    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
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
        let at = self.access(key)?;
        Some(&self.nodes[at].value)
    }

    /// Like `get`, with a mutable reference to the value.
    pub fn get_mut<Q>(&mut self, key: &Q) -> Option<&mut V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        let at = self.access(key)?;
        Some(&mut self.nodes[at].value)
    }

    /// Looks a key up without changing its position or the counters.
    pub fn peek<Q>(&self, key: &Q) -> Option<&V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        self.index.get(key).map(|&at| &self.nodes[at].value)
    }

    /// Inserts or replaces an entry and makes it the most recently used.
    /// Returns the entry that left the cache: the replaced one, or the evicted
    /// least recently used one.
    pub fn put(&mut self, key: K, value: V) -> Option<(K, V)> {
        if let Some(&at) = self.index.get(&key) {
            self.promote(at);
            let old = std::mem::replace(&mut self.nodes[at].value, value);
            return Some((key, old));
        }

        let displaced = if self.nodes.len() == self.capacity {
            self.stats.evictions += 1;
            Some(self.take(self.tail))
        } else {
            None
        };

        let at = self.nodes.len();
        self.index.insert(key.clone(), at);
        self.nodes.push(Node { key, value, prev: NIL, next: NIL });
        self.link_front(at);
        displaced
    }

    /// Removes an entry and returns its value.
    pub fn remove<Q>(&mut self, key: &Q) -> Option<V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        let at = *self.index.get(key)?;
        Some(self.take(at).1)
    }

    /// Every entry, from the most to the least recently used.
    pub fn iter(&self) -> impl Iterator<Item = (&K, &V)> + '_ {
        let mut at = self.head;
        std::iter::from_fn(move || {
            let node = self.nodes.get(at)?; // `NIL` is out of range: the walk ends
            at = node.next;
            Some((&node.key, &node.value))
        })
    }

    /// The part `get` and `get_mut` share: count the access, promote a hit.
    fn access<Q>(&mut self, key: &Q) -> Option<usize>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        match self.index.get(key) {
            Some(&at) => {
                self.stats.hits += 1;
                self.promote(at);
                Some(at)
            }
            None => {
                self.stats.misses += 1;
                None
            }
        }
    }

    /// Makes the node at `at` the most recently used.
    fn promote(&mut self, at: usize) {
        if self.head != at {
            self.unlink(at);
            self.link_front(at);
        }
    }

    /// Takes the node at `at` out of the list. Its own links are left stale.
    fn unlink(&mut self, at: usize) {
        let (prev, next) = (self.nodes[at].prev, self.nodes[at].next);
        match prev {
            NIL => self.head = next,
            _ => self.nodes[prev].next = next,
        }
        match next {
            NIL => self.tail = prev,
            _ => self.nodes[next].prev = prev,
        }
    }

    /// Puts an unlinked node at the head of the list.
    fn link_front(&mut self, at: usize) {
        self.nodes[at].prev = NIL;
        self.nodes[at].next = self.head;
        match self.head {
            NIL => self.tail = at,
            head => self.nodes[head].prev = at,
        }
        self.head = at;
    }

    /// Removes the node at `at` from the list, the index and the storage.
    fn take(&mut self, at: usize) -> (K, V) {
        self.unlink(at);
        // `swap_remove` is O(1) and keeps `nodes` dense, but it does so by
        // moving the last node into the hole. Everything that referred to
        // that node by its old position has to be pointed at `at`.
        let node = self.nodes.swap_remove(at);
        self.index.remove(&node.key);
        if let Some(moved) = self.nodes.get(at) {
            let (prev, next) = (moved.prev, moved.next);
            match prev {
                NIL => self.head = at,
                _ => self.nodes[prev].next = at,
            }
            match next {
                NIL => self.tail = at,
                _ => self.nodes[next].prev = at,
            }
            *self
                .index
                .get_mut(&self.nodes[at].key)
                .expect("every node has an index entry") = at;
        }
        (node.key, node.value)
    }
}
