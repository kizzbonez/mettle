---
title: Files and I/O
summary: Read and write files whole, line by line and through buffers, compose io.Reader and io.Writer values, write code that takes streams so it can be tested, and walk directories with path/filepath and fs.FS.
minutes: 35
objectives:
  - Read and write whole files with os.ReadFile and os.WriteFile, and recognise a missing file with errors.Is
  - Open and create files, close them with defer, and report the Close and Flush errors when writing
  - Read lines with bufio.Scanner and compose streams with io.Copy, io.MultiWriter, io.TeeReader and io.LimitReader
  - Write functions that take io.Reader, io.Writer or fs.FS, and test them without real files
---

## Outline

1. Whole files at once
2. Reading line by line from an io.Reader
3. Writing through a buffer, and the errors that matter
4. Composing readers and writers
5. Paths, directories and fs.FS

## Whole files at once

The simplest way in and out is a whole file as a `[]byte`. `os.WriteFile` creates the file (or empties an existing one) and writes it; `os.ReadFile` reads everything back:

```go
func main() {
	err := os.WriteFile("list.txt", []byte("milk\neggs\n"), 0o644)
	if err != nil {
		fmt.Println(err)
		return
	}
	data, err := os.ReadFile("list.txt")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Printf("%d bytes: %q\n", len(data), data)

	_, err = os.ReadFile("missing.txt")
	fmt.Println(err)
	fmt.Println(errors.Is(err, fs.ErrNotExist))
}
```

```text
10 bytes: "milk\neggs\n"
open missing.txt: no such file or directory
true
```

`0o644` is the **permission** for a new file: the owner may read and write, everyone else may only read. File errors are `*fs.PathError` values that name the operation and the path; test for a missing file with `errors.Is(err, fs.ErrNotExist)`, as Medium 05 showed for any wrapped error. Whole-file reads suit small files; for big or endless input, read a piece at a time.

## Reading line by line from an io.Reader

`os.Open` opens a file for reading and returns an `*os.File`. Close it with `defer f.Close()` straight after the error check, so every return path closes it. An `*os.File` is an **`io.Reader`**, the one-method interface from Medium 03 (`Read(p []byte) (n int, err error)`), and `bufio.Scanner` turns any reader into lines:

```go
// tally counts the orders in r, one per line, skipping blank lines.
func tally(r io.Reader) (map[string]int, error) {
	counts := map[string]int{}
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		if order := strings.TrimSpace(sc.Text()); order != "" {
			counts[order]++
		}
	}
	return counts, sc.Err()
}

func main() {
	fmt.Println(tally(strings.NewReader("tea\ncoffee\ntea\n")))

	f, err := os.Open("orders.txt")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer f.Close()
	fmt.Println(tally(f))
}
```

```text
map[coffee:1 tea:2] <nil>
map[coffee:2 tea:3] <nil>
```

`fmt.Println(tally(...))` hands both results, the map and the error, to `Println`. `orders.txt` holds `tea`, `coffee` with a Windows `\r\n`, a blank line, `tea`, `  coffee  ` and a final `tea` with no newline. `Scan` strips `\n` and `\r\n` and returns the last line too. When `Scan` returns false, `sc.Err()` says why: `nil` at the end of input, or the read error.

Because `tally` takes an `io.Reader` and not a file name, the first call tests it with `strings.NewReader`, no file needed. That is the most useful habit in this lesson: **take an `io.Reader` or `io.Writer`, not a path**, and let one small function deal with opening the file.

## Writing through a buffer, and the errors that matter

`os.Create` creates a file for writing, emptying it if it exists. Each `Write` on an `*os.File` is a system call, so wrap it in a `bufio.Writer`, which collects writes in memory and passes them on in large pieces. Two errors are easy to lose here, and both mean data was not saved: the error from `Flush`, and the error from `Close`.

```go
// writeReport writes one line per order to w.
func writeReport(w io.Writer, orders []string) error {
	for i, order := range orders {
		if _, err := fmt.Fprintf(w, "%d. %s\n", i+1, order); err != nil {
			return err
		}
	}
	return nil
}

// saveReport writes the report to a new file at path.
func saveReport(path string, orders []string) (err error) {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := f.Close(); err == nil {
			err = closeErr
		}
	}()
	w := bufio.NewWriter(f)
	if err := writeReport(w, orders); err != nil {
		return err
	}
	return w.Flush()
}
```

Saving `tea` and `coffee` and reading the file back prints `"1. tea\n2. coffee\n"`. With `return nil` in place of `return w.Flush()`, the same program prints `""`: everything was still in the buffer when the file was closed.

The deferred closure is the pattern from Medium 06: it sets the named result `err` to the `Close` error, but only if nothing failed earlier. A plain `defer f.Close()` is fine for files you only read; for files you write, the `Close` error can be the only sign that the disk was full.

## Composing readers and writers

Small types that wrap a reader or a writer combine like pipes:

- `io.Copy(dst, src)` reads from `src` until the end and writes it all to `dst`;
- `bytes.Buffer` is a reader and a writer in memory;
- `io.LimitReader(r, n)` stops after `n` bytes, a guard against huge input;
- `io.TeeReader(r, w)` writes to `w` whatever is read from `r`;
- `io.MultiWriter(w1, w2)` writes everything to both.

```go
func main() {
	upload := strings.NewReader("first line\nsecond line\nthird line\n")
	var seen, saved bytes.Buffer

	limited := io.LimitReader(upload, 16)   // stops after 16 bytes
	watched := io.TeeReader(limited, &seen) // copies what is read into seen
	both := io.MultiWriter(os.Stdout, &saved)

	n, err := io.Copy(both, watched)
	fmt.Println()
	fmt.Println(n, err)
	fmt.Printf("%q\n%q\n", seen.String(), saved.String())
}
```

```text
first line
secon
16 <nil>
"first line\nsecon"
"first line\nsecon"
```

`io.Copy` returns `nil`, not `io.EOF`: reaching the end is success. `&seen` is passed because `Write` has a pointer receiver on `bytes.Buffer`. None of these functions knows about files, so the same code works on files, network connections and buffers.

## Paths, directories and fs.FS

`path/filepath` builds and splits paths with the operating system's separator (`/` on Linux and macOS, `\` on Windows). `os.ReadDir` lists a directory sorted by name. **`fs.FS`**, from `io/fs`, is an interface for a read-only tree of files with slash-separated paths; `os.DirFS(dir)` gives one for a real directory, and `testing/fstest.MapFS` one in memory for tests:

```go
// countExt counts the files in fsys whose names end in ext.
func countExt(fsys fs.FS, ext string) (int, error) {
	n := 0
	err := fs.WalkDir(fsys, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && path.Ext(p) == ext {
			n++
		}
		return nil
	})
	return n, err
}

func main() {
	p := filepath.Join("photos", "2026", "june", "beach.jpg")
	fmt.Println(p, filepath.Dir(p), filepath.Base(p), filepath.Ext(p))

	entries, err := os.ReadDir("photos")
	if err != nil {
		fmt.Println(err)
		return
	}
	for _, e := range entries {
		fmt.Println(e.Name(), e.IsDir())
	}

	fmt.Println(countExt(os.DirFS("photos"), ".jpg"))
	fmt.Println(countExt(fstest.MapFS{"a.jpg": {}, "old/b.jpg": {}, "c.png": {}}, ".jpg"))
}
```

```text
photos/2026/june/beach.jpg photos/2026/june beach.jpg .jpg
2026 true
cat.png false
2 <nil>
2 <nil>
```

`fs.WalkDir` visits every file and directory in lexical order and calls the function for each; `filepath.WalkDir(root, fn)` does the same on a path on disk. Inside an `fs.FS`, paths always use `/`, so use the `path` package there and `path/filepath` for real paths. To create the folders, `os.MkdirAll(filepath.Join("photos", "2026"), 0o755)` makes every missing level and does nothing if they exist.

When a path comes from a user, `os.OpenRoot(dir)` (Go 1.24) returns an `*os.Root` whose methods refuse to leave `dir`: `root.Open("../etc/passwd")` fails with `path escapes from parent`. Professional 08 covers it.

## Common mistakes

- **Forgetting `Flush`.** The file is empty or cut short, with no error. Return `w.Flush()`'s error.
- **Ignoring the `Close` error after writing.** Use the deferred closure above so a failed close is reported.
- **Writing into a folder that does not exist.** `os.WriteFile("backup/list.txt", ...)` fails with `open backup/list.txt: no such file or directory`. Call `os.MkdirAll` first.
- **Writing to a file from `os.Open`.** It is read-only: `write list.txt: bad file descriptor`. Use `os.Create`, or `os.OpenFile` with flags.
- **Very long lines with `bufio.Scanner`.** A line over 64 KiB stops the scan, and `sc.Err()` returns `bufio.Scanner: token too long`. Raise the limit with `sc.Buffer`, or always check `sc.Err()`.

## Practice

1. Write `lineCount(r io.Reader) (int, error)` and call it with `strings.NewReader("a\nb\nc")`.
2. Copy `strings.NewReader("hello, files")` to `os.Stdout`, but only its first five bytes.
3. Count the `.txt` files in a `fstest.MapFS` holding `a.txt`, `b/c.txt` and `d.md`, with `countExt`.

### Answers

```go
func lineCount(r io.Reader) (int, error) {
	n := 0
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		n++
	}
	return n, sc.Err()
}

func main() {
	fmt.Println(lineCount(strings.NewReader("a\nb\nc")))
	if _, err := io.Copy(os.Stdout, io.LimitReader(strings.NewReader("hello, files"), 5)); err != nil {
		fmt.Println(err)
	}
	fmt.Println()
	fmt.Println(countExt(fstest.MapFS{"a.txt": {}, "b/c.txt": {}, "d.md": {}}, ".txt"))
}
```

```text
3 <nil>
hello
2 <nil>
```

## Key takeaways

- `os.ReadFile` and `os.WriteFile` handle small files whole; check `errors.Is(err, fs.ErrNotExist)`.
- `defer f.Close()` after opening; when writing, return the `Flush` and `Close` errors.
- `bufio.Scanner` reads lines; check `sc.Err()` when the loop ends.
- Take `io.Reader`, `io.Writer` or `fs.FS`, not paths: compose with `io.Copy` and friends, test with `strings.NewReader`, `bytes.Buffer` and `fstest.MapFS`.
- `path/filepath` for real paths, `path` inside an `fs.FS`; `os.MkdirAll`, `os.ReadDir` and `WalkDir` for trees.

## Further reading

- [Package io](https://pkg.go.dev/io)
- [Package os](https://pkg.go.dev/os)
- [Package bufio](https://pkg.go.dev/bufio)
- [Go by Example: Writing Files](https://gobyexample.com/writing-files)
