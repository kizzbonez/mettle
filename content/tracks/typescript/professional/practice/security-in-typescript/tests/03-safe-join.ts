import { describeUpload, safeJoin, type SafePath } from "./solution.js";

const root = "/srv/pantry/photos";

// The brand: only safeJoin makes a SafePath, and it is still a string.
const soup = safeJoin(root, "ana/soup.jpg");
check.equal(describeUpload(soup), "upload stored at /srv/pantry/photos/ana/soup.jpg", "describeUpload accepts what safeJoin returns");
check.true(soup.endsWith(".jpg") && soup.length > root.length, "a SafePath can be used as a string");
// @ts-expect-error a plain string is not a SafePath
describeUpload("/etc/passwd");
// @ts-expect-error a template literal built from the root is not a SafePath either
const forged: SafePath = `${root}/x.jpg`;
void forged;

// Paths that stay inside.
const inside: [string, string][] = [
  ["ana/soup.jpg", "/srv/pantry/photos/ana/soup.jpg"],
  ["./ana/soup.jpg", "/srv/pantry/photos/ana/soup.jpg"],
  ["ana/../bo/pie.jpg", "/srv/pantry/photos/bo/pie.jpg"],
  ["bo//tart.png", "/srv/pantry/photos/bo/tart.png"],
  ["..hidden.jpg", "/srv/pantry/photos/..hidden.jpg"],
  ["cy/..notes/stew.jpg", "/srv/pantry/photos/cy/..notes/stew.jpg"],
  ["new photo (2).jpg", "/srv/pantry/photos/new photo (2).jpg"],
];
for (const [requested, expected] of inside) {
  check.equal(String(safeJoin(root, requested)), expected, `"${requested}" stays inside the folder`);
  check.equal(String(safeJoin(root + "/", requested)), expected, `"${requested}" with a root written with a final slash`);
}

// Paths that escape, or name the folder itself.
const refused = [
  "../config.json",
  "../../../etc/passwd",
  "/etc/passwd",
  "/srv/pantry/secrets.env",
  "ana/../../photos-old/soup.jpg",
  "../photos",
  "",
  ".",
  "ana/..",
  "ana/../..",
  "soup.jpg\0.png",
];
for (const requested of refused) {
  check.throws(() => safeJoin(root, requested), `"${requested.replace("\0", "\\0")}" is refused`, RangeError);
}

// An absolute path that happens to point inside is fine.
check.equal(String(safeJoin(root, "/srv/pantry/photos/ana/soup.jpg")), "/srv/pantry/photos/ana/soup.jpg", "an absolute path inside the folder");
