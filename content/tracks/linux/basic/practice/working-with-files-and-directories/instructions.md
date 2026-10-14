The tests make a newsletter folder, go into it and run your script there:

```bash
bash solution.sh
```

Every name below is relative to that folder. Write one or two commands for each task:

1. Create the folder `archive/2026`, and `archive` with it when it is missing. In some months it
   exists already; that must not cause an error.
2. Copy `letters.txt` into `archive/2026`. The original stays where it is.
3. Copy the whole `templates` folder, with everything inside it, into `archive`, so that
   `archive/templates` holds the same files. Last month's copy may still be there: then the new
   files go into that same `archive/templates`, never into a folder inside it.
4. Rename `draft.txt` to `issue-12.txt`.
5. Delete the file `scratch.txt` and the folder `old`, which is always empty. Use the command
   that removes only an empty folder.

The script must print nothing at all, not even an error message, and must not ask questions, so
leave out `-v` and `-i`.

The visible test starts from this folder:

```text
draft.txt
letters.txt
old/
scratch.txt
templates/
  footer.txt
  header.txt
```

and after your script it must hold exactly:

```text
archive/
  2026/
    letters.txt
  templates/
    footer.txt
    header.txt
issue-12.txt
letters.txt
templates/
  footer.txt
  header.txt
```

Each file keeps its contents. The hidden tests check the contents, a `templates` folder with a
folder of its own inside, and a month in which `archive/2026` and `archive/templates` exist already.
