let mut map = TileMap::new(5, 2);
assert!(map.width() == 5 && map.height() == 2, "the map keeps its width and height");

for y in 0..2 {
    for x in 0..5 {
        assert!(map.tile(x, y) == Some(0), "every tile inside a new map is 0");
    }
}

// One step past each edge.
assert!(
    map.tile(5, 0).is_none(),
    "a column equal to the width is outside the map, even though its index would land in the next row"
);
assert!(map.tile(0, 2).is_none(), "a row equal to the height is outside the map");
assert!(map.tile(9, 1).is_none(), "a column far past the right edge is outside the map");

// Huge coordinates must be refused before any arithmetic is done with them.
assert!(map.tile(usize::MAX, 0).is_none(), "a huge column gives None and does not panic");
assert!(map.tile(0, usize::MAX).is_none(), "a huge row gives None and does not panic");
assert!(
    map.tile(usize::MAX, usize::MAX).is_none(),
    "two huge coordinates give None and do not panic"
);

// set_tile applies the same rule and writes nothing when it refuses.
assert!(
    map.set_tile(5, 0, 7).is_none(),
    "set_tile refuses a column equal to the width"
);
assert!(map.set_tile(0, 2, 7).is_none(), "set_tile refuses a row equal to the height");
assert!(
    map.set_tile(usize::MAX, usize::MAX, 7).is_none(),
    "set_tile gives None for huge coordinates and does not panic"
);
for y in 0..2 {
    for x in 0..5 {
        assert!(map.tile(x, y) == Some(0), "a refused set_tile changes no tile of the map");
    }
}

// Maps without any tile.
let mut no_columns = TileMap::new(0, 4);
assert!(no_columns.tile(0, 0).is_none(), "a map with no columns has no tile to read");
assert!(no_columns.set_tile(0, 3, 1).is_none(), "a map with no columns has no tile to write");
let no_rows = TileMap::new(4, 0);
assert!(
    no_rows.tile(0, 0).is_none() && no_rows.tile(3, 0).is_none(),
    "a map with no rows has no tile to read"
);
