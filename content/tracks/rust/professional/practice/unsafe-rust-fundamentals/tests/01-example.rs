// The example from the instructions, step by step.
let mut map = TileMap::new(4, 3);

assert_eq!(map.tile(3, 2), Some(0), "a tile of a new map");
assert_eq!(map.set_tile(3, 2, 9), Some(0), "what set_tile returns for a tile that was 0");
assert_eq!(map.tile(3, 2), Some(9), "the tile after it was set");
assert_eq!(map.tile(4, 0), None, "a column one past the right edge of a map 4 tiles wide");

// SAFETY: column 3 and row 2 exist in a map of 4 by 3 tiles.
let unchecked = unsafe { map.tile_unchecked(3, 2) };
assert_eq!(unchecked, 9, "the same tile read without the check");

if let Some((first, second)) = map.pair_mut((0, 0), (3, 2)) {
    std::mem::swap(first, second);
}
assert_eq!(map.tile(0, 0), Some(9), "the first tile of the pair after the two were swapped");
assert_eq!(map.tile(3, 2), Some(0), "the second tile of the pair after the two were swapped");

assert!(
    map.pair_mut((1, 1), (1, 1)).is_none(),
    "a pair that names the same tile twice"
);
