let mut map = TileMap::new(4, 2);
map.set_tile(1, 0, 10);
map.set_tile(2, 1, 20);

// Two different tiles: both references are usable at the same time.
{
    let pair = map.pair_mut((1, 0), (2, 1));
    assert!(pair.is_some(), "two different tiles inside the map give a pair");
    let (first, second) = pair.unwrap();
    assert!(
        *first == 10 && *second == 20,
        "the references come back in the order of the arguments"
    );
    *first += 1;
    *second += 2;
}
assert!(
    map.tile(1, 0) == Some(11) && map.tile(2, 1) == Some(22),
    "a write through each reference of the pair reaches its own tile"
);

// The same two tiles, asked for the other way round.
{
    let (first, second) = map.pair_mut((2, 1), (1, 0)).expect("the same pair in the other order");
    assert!(
        *first == 22 && *second == 11,
        "swapping the arguments swaps the references"
    );
}

// Neighbours in one row and in one column are different tiles too.
{
    let (left, right) = map.pair_mut((0, 0), (1, 0)).expect("two neighbours in one row");
    *left = 5;
    *right = 6;
}
{
    let (upper, lower) = map.pair_mut((3, 0), (3, 1)).expect("two neighbours in one column");
    *upper = 7;
    *lower = 8;
}
assert!(
    map.tile(0, 0) == Some(5) && map.tile(1, 0) == Some(6),
    "neighbours in one row are written separately"
);
assert!(
    map.tile(3, 0) == Some(7) && map.tile(3, 1) == Some(8),
    "neighbours in one column are written separately"
);

// One tile named twice must never become two mutable references.
assert!(
    map.pair_mut((3, 1), (3, 1)).is_none(),
    "the same tile named twice gives None"
);

// A tile outside the map, on either side.
assert!(map.pair_mut((4, 0), (0, 0)).is_none(), "a first tile outside the map gives None");
assert!(map.pair_mut((0, 0), (0, 2)).is_none(), "a second tile outside the map gives None");
assert!(
    map.pair_mut((4, 0), (1, 1)).is_none(),
    "a column equal to the width gives None, whatever the other tile is"
);
assert!(
    map.pair_mut((usize::MAX, usize::MAX), (0, 0)).is_none(),
    "huge coordinates give None and do not panic"
);

let mut single = TileMap::new(1, 1);
assert!(
    single.pair_mut((0, 0), (0, 0)).is_none(),
    "a map of one tile has no pair of different tiles"
);

assert!(
    map.tile(2, 1) == Some(22) && map.tile(1, 0) == Some(6),
    "a refused pair_mut changes no tile"
);
