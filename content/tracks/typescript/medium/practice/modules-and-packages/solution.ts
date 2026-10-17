import { join, parse, type ParsedPath } from "node:path";

export interface PhotoName {
  year: number;
  month: number;
  label: string;
  index: number;
}

export const PHOTO_EXTENSION = ".jpg";

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function positiveWhole(text: string): number | undefined {
  const value = Number(text);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function fromParts(parts: ParsedPath): PhotoName | undefined {
  const pieces = parts.name.split("-");
  if (parts.ext !== PHOTO_EXTENSION || pieces.length !== 4) {
    return undefined;
  }
  const year = positiveWhole(pieces[0]);
  const month = positiveWhole(pieces[1]);
  const label = pieces[2];
  const index = positiveWhole(pieces[3]);
  if (year === undefined || month === undefined || label === "" || index === undefined) {
    return undefined;
  }
  return { year, month, label, index };
}

export function photoFileName(photo: PhotoName): string {
  return `${photo.year}-${twoDigits(photo.month)}-${photo.label}-${twoDigits(photo.index)}${PHOTO_EXTENSION}`;
}

export function archivePath(folder: string, photo: PhotoName): string {
  return join(folder, String(photo.year), photoFileName(photo));
}

export function photoFromPath(path: string): PhotoName | undefined {
  return fromParts(parse(path));
}

export default function describePhoto(photo: PhotoName): string {
  return `${photo.label} #${photo.index}, ${photo.month}/${photo.year}`;
}
