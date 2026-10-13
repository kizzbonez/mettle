A level editor for a tile-based game keeps its map as one flat buffer of tile numbers. The
paint tools read and swap tiles in their innermost loop, so that loop skips the bounds check,
and everything around it has to make that safe.
