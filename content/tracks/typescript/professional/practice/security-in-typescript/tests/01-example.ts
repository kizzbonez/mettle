import { isValidHandle, mergeSettings, safeJoin, type Settings } from "./solution.js";

// The example from the instructions.

const settings: Settings = { theme: "light", notify: { email: true, sms: false } };
mergeSettings(settings, JSON.parse('{ "notify": { "sms": true }, "__proto__": { "isAdmin": true } }'));
check.equal(settings, { theme: "light", notify: { email: true, sms: true } }, "the nested setting is merged and __proto__ is skipped");
check.equal(({} as Settings)["isAdmin"], undefined, "nothing reached Object.prototype");
check.throws(() => mergeSettings(settings, "dark"), "a body that is not an object is refused", TypeError);

check.equal(String(safeJoin("/srv/pantry/photos", "ana/soup.jpg")), "/srv/pantry/photos/ana/soup.jpg", "a file inside the folder");
check.throws(() => safeJoin("/srv/pantry/photos", "../config.json"), "a path that climbs out of the folder is refused", RangeError);

check.equal(isValidHandle("chef.ana-42"), true, "a handle with both separators");
check.equal(isValidHandle("chef--ana"), false, "two separators in a row");
check.equal(isValidHandle("a".repeat(31) + "!"), false, "a crafted handle is refused at once");
