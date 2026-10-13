Complete `TileMap`. The struct, `new`, `width` and `height` are written. Keep the fields
private and the signatures as they are.

The tiles are stored row after row in one buffer, so the tile in column `x` of row `y` is at
index `y * width + x`. The type's **invariant** is `tiles.len() == width * height`. `new`
establishes it and no method may break it.

1. `unsafe fn tile_unchecked(&self, x: usize, y: usize) -> u8` reads a tile through a raw
   pointer with no check: take `self.tiles.as_ptr()`, move it with `add`, and dereference it.
   Write the contract the caller must meet under `# Safety`.
2. `tile(&self, x: usize, y: usize) -> Option<u8>` is the safe version. It returns `None`
   unless `x < width` and `y < height`, and otherwise the result of `tile_unchecked`.
3. `set_tile(&mut self, x: usize, y: usize, tile: u8) -> Option<u8>` writes a tile through
   `self.tiles.as_mut_ptr()` and returns the tile that was there before. Outside the map it
   writes nothing and returns `None`.
4. `pair_mut(&mut self, first: (usize, usize), second: (usize, usize)) -> Option<(&mut u8, &mut u8)>`
   returns mutable references to two tiles at once, each named as `(x, y)`, in the order of
   the arguments. It returns `None` if either tile is outside the map, or if both name the
   same tile.

A coordinate outside the map always gives `None` and never a panic. That includes a column
equal to `width`, whose index would land in the next row, and a huge value such as
`usize::MAX`, which must be refused before any arithmetic is done with it.

**Soundness is your job.** The tests see only what your methods return. They cannot see
undefined behaviour, so a run that passes does not show that the code is sound. Put a
`// SAFETY:` comment above every `unsafe` block and make it answer two questions. Why is the
index inside the buffer? Name the check and the invariant. And in `pair_mut`: why can the two
`&mut` never point at the same tile?

Example:

```rust
let mut map = TileMap::new(4, 3);      // 4 columns, 3 rows, every tile 0

map.tile(3, 2)                         // Some(0)
map.set_tile(3, 2, 9)                  // Some(0), the tile it replaced
map.tile(3, 2)                         // Some(9)
map.tile(4, 0)                         // None: there is no column 4
unsafe { map.tile_unchecked(3, 2) }    // 9

if let Some((first, second)) = map.pair_mut((0, 0), (3, 2)) {
    std::mem::swap(first, second);     // two `&mut u8` into the same map
}
map.tile(0, 0)                         // Some(9)
map.tile(3, 2)                         // Some(0)
map.pair_mut((1, 1), (1, 1))           // None: the same tile twice
```
