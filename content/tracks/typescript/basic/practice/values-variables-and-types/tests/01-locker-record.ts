import { doors, doorsFree, lastScanCode, lockerName, openAllNight, parcelsWaiting } from "./solution.js";

// The values from the example in the instructions.
check.equal(lockerName, "Corner Shop Locker", "the locker's name");
check.equal(doors, 24, "the number of doors");
check.equal(openAllNight, true, "whether the locker is open all night");
check.equal(parcelsWaiting, 13, "the parcels waiting after the day's three changes");
check.equal(doorsFree, 11, "the doors free at the end of the day");
check.equal(lastScanCode, "PARCEL-0042", "the last scan code, in capitals");
