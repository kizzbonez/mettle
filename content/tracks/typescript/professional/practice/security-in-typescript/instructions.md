Keep `Settings` and `describeUpload` as they are. The tests send each function the inputs an
attacker would send, check that nothing reaches `Object.prototype` or leaves the upload
folder, and give the validator inputs crafted to make a backtracking pattern run for hours; a
validator that can split its input only one way answers them at once.

1. **`SafePath`**: replace the placeholder with a **branded** string type, so that a plain
   string such as `"/etc/passwd"` cannot be passed to `describeUpload`, while the result of
   `safeJoin` can, and can still be used as a string.
2. **`mergeSettings(target: Settings, source: unknown): Settings`** copies a parsed JSON body
   into `target` and returns `target`:
   - If `source` is not a plain object (it is `null`, an array, a string, a number...), throw a
     `TypeError`.
   - Skip the keys `__proto__`, `constructor` and `prototype`, at every depth.
   - A value that is a plain object is merged recursively: into `target[key]` when that is an
     **own** property holding a plain object, otherwise into a new `{}` stored at `target[key]`
     (so `target` never shares an object with `source`). Any other value, arrays included,
     replaces `target[key]`.
3. **`safeJoin(root: string, requested: string): SafePath`** returns the absolute path of a file
   a member asked for, inside the folder `root` (an absolute POSIX path). Compute it with
   `posix.resolve(root, requested)`, then check it with `posix.relative(root, path)`: if that is
   empty (the folder itself), `..`, starts with `../`, or is absolute, throw a `RangeError`. Also
   throw a `RangeError` when `requested` contains a null byte (`"\0"`).
4. **`isValidHandle(text: string): boolean`**: a handle is 3 to 32 characters of words made of
   `a` to `z` and `0` to `9`, joined by single `-` or `.` characters, with no separator at the
   start or the end. The starter's version answers correctly but backtracks catastrophically;
   rewrite it so every separator must be followed by a word.

Example:

```ts
const settings: Settings = { theme: "light", notify: { email: true, sms: false } };
mergeSettings(settings, JSON.parse('{ "notify": { "sms": true }, "__proto__": { "isAdmin": true } }'));
// { theme: "light", notify: { email: true, sms: true } }
({} as Settings)["isAdmin"]                          // undefined: nothing reached Object.prototype
mergeSettings(settings, "dark")                      // throws a TypeError

safeJoin("/srv/pantry/photos", "ana/soup.jpg")       // "/srv/pantry/photos/ana/soup.jpg"
safeJoin("/srv/pantry/photos", "../config.json")     // throws a RangeError
describeUpload(safeJoin("/srv/pantry/photos", "bo/pie.jpg"))   // fine
describeUpload("/etc/passwd")                        // compile error

isValidHandle("chef.ana-42")                         // true
isValidHandle("chef--ana")                           // false
isValidHandle("a".repeat(31) + "!")                  // false, at once
```

**Tip:** `Object.hasOwn(target, key)` tells an own property from an inherited one such as
`toString`. Checking that a path *starts with* the root string is not enough:
`/srv/pantry/photos-old` starts with `/srv/pantry/photos`.
