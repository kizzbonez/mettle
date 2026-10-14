The tests build a small store of folders, go into a folder **two levels below the top** of the
store, and run your script from there:

```bash
bash solution.sh
```

So the working directory is that folder, and every relative path starts from it. Each test builds a
different store with different names, at a different place, so reach the other folders with `..`
and never type their names or a path starting with `/`.

The starter prints three headings. Under each one:

1. **here**: list everything in the working directory, hidden names included, but not `.` and
   `..`. Names only, without marks.
2. **one level up**: list the names in the parent directory, with a `/` after the name of every
   folder. Hidden names are left out here.
3. **top**: go up two levels with `cd`, print the absolute path of the folder you are now in, and
   then list its names with a `/` after every folder name. Hidden names are left out here too.

`ls` prints one name per line here, because its output goes to the test rather than to a
terminal, and it sorts the names. Hidden names come first, because `.` sorts before letters.

The visible test builds this store in `/work`, the sandbox's working folder, and runs the script in
`props1/costumes/hats`:

```text
props1/
  costumes/
    capes.txt
    hats/          <- the working directory
      .label
      bowler.txt
      crown.txt
  lights/
  scenery/
  stock-list.txt
```

For it, the script prints:

```text
== here ==
.label
bowler.txt
crown.txt
== one level up ==
capes.txt
hats/
== top ==
/work/props1
costumes/
lights/
scenery/
stock-list.txt
```

The hidden tests use other stores: names with spaces, several hidden files, folders inside the
working directory, and a store that sits deeper, so its absolute path is longer.
