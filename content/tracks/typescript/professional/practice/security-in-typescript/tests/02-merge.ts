import { mergeSettings, type Settings } from "./solution.js";

function prototypeIsClean(what: string): void {
  check.equal(Object.keys(Object.prototype), [], `${what}: Object.prototype gained no keys`);
  const visitor: Settings = {};
  check.equal([visitor["isAdmin"], visitor["polluted"], visitor["role"]], [undefined, undefined, undefined], `${what}: a new object inherits nothing`);
}

// Attacks through __proto__, constructor and prototype.
const top: Settings = { theme: "light" };
const returned = mergeSettings(top, JSON.parse('{ "__proto__": { "isAdmin": true }, "theme": "dark" }'));
check.true(returned === top, "mergeSettings returns the target itself");
check.equal(top, { theme: "dark" }, "a top-level __proto__ key is skipped, the other keys are merged");
check.true(Object.getPrototypeOf(top) === Object.prototype, "the target keeps its normal prototype");
prototypeIsClean("__proto__ at the top");

const nested: Settings = { notify: { email: true } };
mergeSettings(nested, JSON.parse('{ "notify": { "__proto__": { "polluted": true }, "sms": true } }'));
check.equal(nested, { notify: { email: true, sms: true } }, "a nested __proto__ key is skipped");
prototypeIsClean("__proto__ one level down");

const deeper: Settings = {};
mergeSettings(deeper, JSON.parse('{ "kitchen": { "oven": { "__proto__": { "role": "admin" }, "unit": "C" } } }'));
check.equal(deeper, { kitchen: { oven: { unit: "C" } } }, "a __proto__ key two levels down is skipped");
prototypeIsClean("__proto__ two levels down");

const viaConstructor: Settings = {};
mergeSettings(viaConstructor, JSON.parse('{ "constructor": { "prototype": { "polluted": true } }, "prototype": { "role": "admin" }, "diet": "vegan" }'));
check.equal(viaConstructor, { diet: "vegan" }, "constructor and prototype keys are skipped");
check.true(!Object.hasOwn(viaConstructor, "constructor") && viaConstructor.constructor === Object, "the target's constructor is untouched");
prototypeIsClean("constructor.prototype");

// Ordinary merging.
const profile: Settings = { units: "metric", notify: { email: true, sms: false }, tags: ["soup", "bread"] };
mergeSettings(profile, { notify: { sms: true }, tags: ["cake"], servings: 4, units: null });
check.equal(
  profile,
  { units: null, notify: { email: true, sms: true }, tags: ["cake"], servings: 4 },
  "objects are merged; arrays, numbers and null replace",
);

const replaced: Settings = { notify: "off" };
mergeSettings(replaced, { notify: { email: true } });
check.equal(replaced, { notify: { email: true } }, "an object replaces a value that is not an object");

const inherited: Settings = {};
mergeSettings(inherited, { toString: { shown: true } });
check.equal(inherited["toString"], { shown: true }, "an inherited method is not merged into, the value becomes an own property");
check.equal(typeof Object.prototype.toString, "function", "Object.prototype.toString is untouched");

const source = JSON.parse('{ "diet": { "vegan": true } }') as { diet: { vegan: boolean } };
const copy = mergeSettings({}, source);
(copy["diet"] as Settings)["vegan"] = false;
check.equal(source.diet.vegan, true, "the target never shares a nested object with the source");

// Bodies that are not objects.
for (const body of [null, [], ["theme"], "dark", 42, true, undefined]) {
  check.throws(() => mergeSettings({}, body), `a body of ${JSON.stringify(body) ?? "undefined"} is refused`, TypeError);
}
prototypeIsClean("after every test");
