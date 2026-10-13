//! Tile Map
//!
//! The map of a level editor: `width` by `height` tiles in one buffer, row
//! after row. Tiles are read and written through raw pointers, and the safe
//! methods around them are what keeps every pointer inside the buffer.

/// A grid of tile numbers.
pub struct TileMap {
    tiles: Box<[u8]>,
    width: usize,
    height: usize, // invariant: tiles.len() == width * height
}

impl TileMap {
    /// Creates a map in which every tile is 0.
    ///
    /// # Panics
    ///
    /// Panics if `width * height` does not fit in a `usize`.
    pub fn new(width: usize, height: usize) -> TileMap {
        let count = width.checked_mul(height).expect("the map is too large");
        TileMap { tiles: vec![0; count].into_boxed_slice(), width, height }
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    /// The index of a tile in the buffer, or `None` outside the map.
    fn index_of(&self, x: usize, y: usize) -> Option<usize> {
        if x < self.width && y < self.height {
            // At most `(height - 1) * width + (width - 1)`, which is one less
            // than `width * height`: no overflow, and inside the buffer.
            Some(y * self.width + x)
        } else {
            None
        }
    }

    /// Returns the tile in column `x` of row `y` without a bounds check.
    ///
    /// # Safety
    ///
    /// `x` must be less than `self.width()` and `y` less than `self.height()`.
    pub unsafe fn tile_unchecked(&self, x: usize, y: usize) -> u8 {
        // SAFETY: the caller promises `x < width` and `y < height`, so
        // `y * width + x` is less than `width * height`, which is
        // `tiles.len()` by the type's invariant. The pointer stays inside the
        // buffer, and `&self` means nobody is writing to it.
        unsafe { *self.tiles.as_ptr().add(y * self.width + x) }
    }

    /// Returns the tile in column `x` of row `y`, or `None` outside the map.
    pub fn tile(&self, x: usize, y: usize) -> Option<u8> {
        if x >= self.width || y >= self.height {
            return None;
        }
        // SAFETY: both coordinates were checked on the lines above.
        Some(unsafe { self.tile_unchecked(x, y) })
    }

    /// Writes a tile and returns the one it replaced, or `None` outside the map.
    pub fn set_tile(&mut self, x: usize, y: usize, tile: u8) -> Option<u8> {
        let index = self.index_of(x, y)?;
        let slot = self.tiles.as_mut_ptr();
        // SAFETY: `index_of` only returns an index below `width * height`,
        // which is `tiles.len()` by the invariant. `&mut self` means no other
        // reference to the buffer exists while we read and write the tile.
        unsafe {
            let slot = slot.add(index);
            let previous = *slot;
            *slot = tile;
            Some(previous)
        }
    }

    /// Returns mutable references to two different tiles, each named as
    /// `(x, y)`, or `None` if one is outside the map or both are the same tile.
    pub fn pair_mut(
        &mut self,
        first: (usize, usize),
        second: (usize, usize),
    ) -> Option<(&mut u8, &mut u8)> {
        let a = self.index_of(first.0, first.1)?;
        let b = self.index_of(second.0, second.1)?;
        if a == b {
            return None;
        }
        let start = self.tiles.as_mut_ptr();
        // SAFETY: `a` and `b` come from `index_of`, so both are inside the
        // buffer. They are different, so the two `&mut` point at different
        // tiles and never overlap. Both borrow from `self`, so they cannot
        // outlive the map, and the map cannot be used while they are alive.
        unsafe { Some((&mut *start.add(a), &mut *start.add(b))) }
    }
}
