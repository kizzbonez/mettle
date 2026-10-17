// The parcel locker at the corner shop keeps a small record about itself.
//
// `export` in front of a declaration lets the tests read that name; lesson 13
// explains it. Write only between the two YOUR CODE lines.

// ---------- YOUR CODE starts here ----------

// Task 1: these three were declared with `any`, which switches type checking
// off for them. Replace each `any` with the right primitive type.
export const lockerName: string = "Corner Shop Locker";
export const doors: number = 24;
export const openAllNight: boolean = true;

// Task 2: the day starts with 7 parcels waiting. Then a courier delivers 5,
// customers collect 3, and a second courier delivers 4. Below this
// declaration, write one assignment for each of those three changes. The
// compiler will tell you what has to change about the declaration itself.
export let parcelsWaiting = 7;
parcelsWaiting = parcelsWaiting + 5;
parcelsWaiting = parcelsWaiting - 3;
parcelsWaiting = parcelsWaiting + 4;

// Task 3: the scanner's last reading arrives as `unknown`. Write an `if` that
// checks with typeof that lastScan is a string, and inside its braces set
// lastScanCode to lastScan in capitals (with toUpperCase).
export const lastScan: unknown = "parcel-0042";
export let lastScanCode = "none";
if (typeof lastScan === "string") {
  lastScanCode = lastScan.toUpperCase();
}

// ---------- YOUR CODE ends here ----------

// Worked out from your values when the program starts.
export const doorsFree = doors - parcelsWaiting;
