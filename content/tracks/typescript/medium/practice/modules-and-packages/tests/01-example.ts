// The example from the instructions: a default import and named imports in one line, with
// the interface marked as a type.
import describePhoto, { archivePath, PHOTO_EXTENSION, photoFileName, photoFromPath, type PhotoName } from "./solution.js";

const beach: PhotoName = { year: 1987, month: 6, label: "beach", index: 1 };
check.equal(photoFileName(beach), "1987-06-beach-01.jpg", "photoFileName of the beach photo");
check.equal(archivePath("scans", beach), "scans/1987/1987-06-beach-01.jpg", 'archivePath("scans", beach)');
check.equal(photoFromPath("scans/1987/1987-06-beach-01.jpg"), beach, "photoFromPath reads the beach photo back");
check.equal(photoFromPath("scans/1987/notes.txt"), undefined, "photoFromPath of a text file");
check.equal(describePhoto(beach), "beach #1, 6/1987", "describePhoto, the default export, of the beach photo");
check.equal(PHOTO_EXTENSION, ".jpg", "PHOTO_EXTENSION is still exported");
