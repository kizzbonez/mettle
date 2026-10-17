// The module exports exactly the listed names, and describePhoto is its default export.
import * as archive from "./solution.js";
import describePhoto from "./solution.js";

check.equal(
  Object.keys(archive).sort(),
  ["PHOTO_EXTENSION", "archivePath", "default", "photoFileName", "photoFromPath"],
  "the module exports the four named values and a default, and keeps its helpers private",
);
check.true(archive.default === describePhoto, "the default export is the same function under any local name");

const fair = { year: 1999, month: 11, label: "fair", index: 12 };
check.equal(archive.photoFileName(fair), "1999-11-fair-12.jpg", "two-digit months and indexes are not padded further");
check.equal(
  archive.photoFileName({ year: 2003, month: 1, label: "graduation", index: 140 }),
  "2003-01-graduation-140.jpg",
  "an index of three digits is kept whole",
);
check.equal(describePhoto(fair), "fair #12, 11/1999", "describePhoto of a November photo");
check.equal(
  describePhoto({ year: 1975, month: 3, label: "wedding", index: 7 }),
  "wedding #7, 3/1975",
  "describePhoto writes the month and index without padding",
);
check.equal(archive.archivePath("albums", fair), "albums/1999/1999-11-fair-12.jpg", "archivePath files the photo under its year");
