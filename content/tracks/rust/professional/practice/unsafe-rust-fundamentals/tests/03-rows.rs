// A map that is not square, so that mixing up columns and rows shows.
let mut map = TileMap::new(3, 4);

let mut next = 1_u8;
for y in 0..4 {
    for x in 0..3 {
        assert!(
            map.set_tile(x, y, next) == Some(0),
            "set_tile returns the tile it replaced, which is 0 for a tile that was never set"
        );
        next += 1;
    }
}

let mut expected = 1_u8;
for y in 0..4 {
    for x in 0..3 {
        assert!(
            map.tile(x, y) == Some(expected),
            "every tile keeps the value that was set for its own column and row"
        );
        // SAFETY: `x < 3` and `y < 4`, the width and height of this map.
        let unchecked = unsafe { map.tile_unchecked(x, y) };
        assert!(
            unchecked == expected,
            "tile_unchecked reads the same tile as tile for coordinates inside the map"
        );
        expected += 1;
    }
}

assert!(
    map.set_tile(2, 3, 200) == Some(12),
    "set_tile returns the tile that was there before, not the new one"
);
assert!(map.tile(2, 3) == Some(200), "the tile holds the value of the last set_tile");
assert!(
    map.set_tile(2, 3, 201) == Some(200),
    "a second set_tile on the same tile returns what the first one wrote"
);
assert!(map.tile(1, 3) == Some(11), "setting a tile leaves its neighbour in the same row alone");
assert!(map.tile(2, 2) == Some(9), "setting a tile leaves its neighbour in the same column alone");

// A single row and a single column.
let mut row = TileMap::new(6, 1);
row.set_tile(5, 0, 44);
assert!(
    row.tile(5, 0) == Some(44) && row.tile(4, 0) == Some(0),
    "a map of one row stores its last tile in the last column"
);
let mut column = TileMap::new(1, 6);
column.set_tile(0, 5, 55);
assert!(
    column.tile(0, 5) == Some(55) && column.tile(0, 4) == Some(0),
    "a map of one column stores its last tile in the last row"
);
