//! Tile Map
//!
//! The map of a level editor: `width` by `height` tiles in one buffer, row
//! after row. Tiles are read and written through raw pointers, and the safe
//! methods around them are what keeps every pointer inside the buffer.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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

    /// Returns the tile in column `x` of row `y` without a bounds check.
    ///
    /// # Safety
    ///
    /// TODO 1: say what the caller must guarantee about `x` and `y`.
    pub unsafe fn tile_unchecked(&self, x: usize, y: usize) -> u8 {
        // TODO 1: `self.tiles.as_ptr()`, moved with `add`, then dereferenced
        //         inside an `unsafe` block with a `// SAFETY:` comment
        todo!("tile_unchecked")
    }

    /// Returns the tile in column `x` of row `y`, or `None` outside the map.
    pub fn tile(&self, x: usize, y: usize) -> Option<u8> {
        // TODO 2: check both coordinates, then call `tile_unchecked`
        todo!("tile")
    }

    /// Writes a tile and returns the one it replaced, or `None` outside the map.
    pub fn set_tile(&mut self, x: usize, y: usize, tile: u8) -> Option<u8> {
        // TODO 3: check, then read and write through `self.tiles.as_mut_ptr()`
        todo!("set_tile")
    }

    /// Returns mutable references to two different tiles, each named as
    /// `(x, y)`, or `None` if one is outside the map or both are the same tile.
    pub fn pair_mut(
        &mut self,
        first: (usize, usize),
        second: (usize, usize),
    ) -> Option<(&mut u8, &mut u8)> {
        // TODO 4: the borrow checker refuses two `&mut` into one buffer, so
        //         the proof that they never overlap is yours
        todo!("pair_mut")
    }
}
