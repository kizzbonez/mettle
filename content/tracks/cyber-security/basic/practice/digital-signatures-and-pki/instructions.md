The script is run as `bash solution.sh PUBKEY FILE...`. The project signs every release file with
its private key, as in the lesson (`openssl dgst -sha256 -sign`), and ships the signature next to
it as `FILE.sig`. Volunteers check the files with the project's **public** key, which they got from
the project's website in advance.

The starter already has the loop and the `if` tests. Replace the three `false` commands marked
`YOUR CODE`. In `if COMMAND; then`, the lines after `then` run when `COMMAND` succeeds (exit status
0), just like `COMMAND && ...` from Shell Foundations.

1. **The key.** The test must succeed when the `PUBKEY` file contains the text `PRIVATE KEY`
   (`grep -q 'PRIVATE KEY' "$pubkey"`), **or** when
   `openssl pkey -pubin -in "$pubkey" -noout` fails (a missing file, or not a public key). The
   script then prints `KEY UNUSABLE` and exits with status 2 without checking any file. A private
   key never belongs on a volunteer's machine.
2. **Each file**, in the order given, prints one line `FILE STATUS`, with `FILE` written exactly as
   given (names may contain spaces). The first rule that applies gives the status:
   - `MISSING` when `FILE` does not exist (already written);
   - `UNSIGNED` when `FILE.sig` does not exist: write this test like the one above it;
   - `OK` when `openssl dgst -sha256 -verify "$pubkey" -signature "$file.sig" "$file"` succeeds;
   - `BAD-SIGNATURE` otherwise (already written): the file was changed, it was signed with
     another key, or the `.sig` file is not a signature.
3. Print nothing else: send openssl's own output (`Verified OK` and error messages) to
   `/dev/null` with `>/dev/null 2>&1`. The starter exits with status 0 when every file is `OK`
   (also when no files are given), otherwise 1.

**Example.** The visible test signs copies of the three files in `data/`, appends a line to
`install.sh`, deletes `station.conf.sig`, and runs:

```console
$ bash solution.sh t1-signing.pub t1-release/firmware-notes.txt t1-release/install.sh t1-release/station.conf t1-release/calibration.csv
t1-release/firmware-notes.txt OK
t1-release/install.sh BAD-SIGNATURE
t1-release/station.conf UNSIGNED
t1-release/calibration.csv MISSING
$ echo $?
1
```

**Tips.** `A || B` succeeds when either succeeds, and `! COMMAND` turns success into failure and
failure into success. `grep -q` prints nothing; only its exit status tells whether the text was
found. Add `2>/dev/null` to the `grep` so that a missing key file prints no error.
