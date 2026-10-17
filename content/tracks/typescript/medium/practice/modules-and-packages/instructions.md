Other scripts import your file as `"./solution.js"`, as the tests do: a relative import under
`nodenext` names the compiled `.js` file. Turn the starter into a module with these exports.

1. **The import line.** Import the functions `join` and `parse` by name from Node's built-in
   module `"node:path"`, and its interface `ParsedPath` marked as a type (`type ParsedPath` inside
   the braces, or a separate `import type` line). A test reads your `solution.ts` to check this.
2. **Named exports.** Export the interface `PhotoName`, the constant `PHOTO_EXTENSION` and these
   three functions:
   - `photoFileName(photo: PhotoName): string` returns `<year>-<month>-<label>-<index>.jpg`, with
     the month and the index padded to two digits by the starter's `twoDigits`.
   - `archivePath(folder: string, photo: PhotoName): string` returns
     `join(folder, <year as text>, <file name>)`. `join` puts `/` between the parts and also
     tidies doubled slashes and `..`.
   - `photoFromPath(path: string): PhotoName | undefined` takes the path apart with `parse` and
     hands the `ParsedPath` it returns to a private helper of yours. It gives a `PhotoName` only
     when the extension (`ext`) is exactly `.jpg` and the name (`name`, the file name without
     folder or extension) splits on `-` into exactly four parts: year, month, label, index. The
     year, month and index, converted with `Number`, must be whole numbers above 0 (so `"06"` is
     6), and the label must not be empty. Otherwise it returns `undefined`.
3. **The default export** is `describePhoto(photo: PhotoName): string`, which returns
   `<label> #<index>, <month>/<year>` with plain numbers.
4. **Nothing else is exported.** `twoDigits` and your helper stay private to the module.

Example:

```ts
import describePhoto, { archivePath, photoFileName, photoFromPath, type PhotoName } from "./solution.js";

const beach: PhotoName = { year: 1987, month: 6, label: "beach", index: 1 };
photoFileName(beach)                                // "1987-06-beach-01.jpg"
archivePath("scans", beach)                         // "scans/1987/1987-06-beach-01.jpg"
photoFromPath("scans/1987/1987-06-beach-01.jpg")    // { year: 1987, month: 6, label: "beach", index: 1 }
photoFromPath("scans/1987/notes.txt")               // undefined
describePhoto(beach)                                // "beach #1, 6/1987"
```

`parse("scans/1987/1987-06-beach-01.jpg")` gives an object whose `name` is `"1987-06-beach-01"`
and whose `ext` is `".jpg"`.
