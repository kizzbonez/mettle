// photoFromPath accepts only archive names, and reads back what archivePath writes.
import { archivePath, photoFromPath, type PhotoName } from "./solution.js";

check.equal(
  photoFromPath("1990-12-snow-15.jpg"),
  { year: 1990, month: 12, label: "snow", index: 15 },
  "a file name without a folder",
);
check.equal(
  photoFromPath("/home/ana/scans/1968/1968-08-harbour-03.jpg"),
  { year: 1968, month: 8, label: "harbour", index: 3 },
  "an absolute path",
);
check.equal(photoFromPath("scans/1987/1987-06-beach-01.png"), undefined, "a .png file is not an archive photo");
check.equal(photoFromPath("scans/1987/1987-06-beach-01.JPG"), undefined, "the extension must be exactly .jpg");
check.equal(photoFromPath("scans/1987/1987-06-beach-01"), undefined, "a file without an extension");
check.equal(photoFromPath("1987-06-beach.jpg"), undefined, "a name with three parts");
check.equal(photoFromPath("1987-06-beach-day-01.jpg"), undefined, "a name with five parts");
check.equal(photoFromPath("1987-June-beach-01.jpg"), undefined, "a month that is not a number");
check.equal(photoFromPath("1987-00-beach-01.jpg"), undefined, "a month of 0");
check.equal(photoFromPath("1987-06-beach-1.5.jpg"), undefined, "an index that is not whole");
check.equal(photoFromPath("1987-06--01.jpg"), undefined, "an empty label");

const photos: PhotoName[] = [
  { year: 1987, month: 6, label: "beach", index: 1 },
  { year: 2001, month: 10, label: "pumpkins", index: 22 },
];
for (const photo of photos) {
  check.equal(photoFromPath(archivePath("scans", photo)), photo, "photoFromPath reads back what archivePath wrote");
}

// @ts-expect-error a PhotoName must have an index
const noIndex: PhotoName = { year: 1987, month: 6, label: "beach" };
// @ts-expect-error photoFromPath may find no photo, so its result is not always a PhotoName
const surely: PhotoName = photoFromPath("1987-06-beach-01.jpg");
