// Photo Archive Module
//
// Other scripts import this file as "./solution.js". So far they can import only
// PHOTO_EXTENSION: your tasks are the import line, the exports and four function bodies.

// Task 1: import join and parse from "node:path", and its type ParsedPath, marked as a type.

// Task 2: export this interface.
interface PhotoName {
  year: number;
  month: number;
  label: string;
  index: number;
}

export const PHOTO_EXTENSION = ".jpg";

// Stays private to this module: do not export it.
function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

// Task 2: export these three functions and write their bodies.
function photoFileName(photo: PhotoName): string {
  throw new Error("Not implemented");
}

function archivePath(folder: string, photo: PhotoName): string {
  throw new Error("Not implemented");
}

function photoFromPath(path: string): PhotoName | undefined {
  throw new Error("Not implemented");
}

// Task 3: make this the module's default export, and write its body.
function describePhoto(photo: PhotoName): string {
  throw new Error("Not implemented");
}
