// Volume and the printed size.
var cube = new BoxSize(10, 10, 10);
Check.Equal(cube.Volume, 1000, "the volume of a box with three equal sides");
var flat = new BoxSize(30, 25, 4);
Check.Equal(flat.Volume, 3000, "the volume multiplies all three measurements");
Check.Equal(flat.ToString(), "30x25x4", "the printed size lists the width, the depth and the height in that order");
Check.Equal($"box {flat}", "box 30x25x4", "the size printed inside an interpolated string");
Check.Equal(new BoxSize(1, 1, 1).Volume, 1, "the volume of the smallest box");

// The default value of the struct.
Check.Equal(default(BoxSize).Volume, 0, "the volume of a default box size");
Check.Equal(default(BoxSize).ToString(), "0x0x0", "the printed size of a default box size");
Check.Equal(new BoxSize().ToString(), "0x0x0", "the printed size of a box made with new BoxSize()");
var shelf = new BoxSize[2];
Check.Equal(shelf[1].ToString(), "0x0x0", "a box size in a new array starts as the default");

// Deconstruction, position by position.
var (w, d, h) = new BoxSize(12, 18, 7);
Check.Equal(w, 12, "the first part of a deconstructed box is the width");
Check.Equal(d, 18, "the second part of a deconstructed box is the depth");
Check.Equal(h, 7, "the third part of a deconstructed box is the height");
var (_, _, tall) = new BoxSize(40, 30, 35);
Check.Equal(tall, 35, "two discards keep only the height");
var (_, deep, _) = new BoxSize(40, 30, 35);
Check.Equal(deep, 30, "two discards keep only the depth");

// A copy carries the same measurements.
var copy = flat;
Check.Equal(copy.ToString(), flat.ToString(), "a copied box size prints the same");
Check.Equal(copy.Volume, flat.Volume, "a copied box size has the same volume");
