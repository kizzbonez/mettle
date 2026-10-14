A folder is a list. Each of its items is either a **file**, given as its size in MB (an `int`),
or another **folder** (a list), which may hold files and folders of its own, to any depth. The
tests call the three functions directly, so keep their names and parameters. None of them may
print anything or change the folder it is given.

1. `count_files(folder)` returns how many files `folder` holds, at any depth. The starter's
   version keeps its count in a global name, `files_counted`: its first call gives the right
   answer, and every later call goes on adding to the old count. Rewrite it **without
   `global`**: count in a local name, add what each recursive call **returns**, and return the
   result. You may delete `files_counted`.
2. `total_size(folder)` returns the sum of the sizes of all the files in `folder`, at any depth.
   A folder with no files gives `0`.
3. `largest_file(folder)` returns the size of the largest file in `folder`, at any depth, or `0`
   if it holds no file at all.

Example:

```python
phone = [120, [45, 3, [800, 2]], [], [[16]]]
count_files(phone)        # 6
count_files(phone)        # 6 again, however often it is called
total_size(phone)         # 986
largest_file(phone)       # 800, from two folders down
largest_file([[], []])    # 0
```

**Tips.** Each function follows the lesson's `total`: loop over the items, and when
`isinstance(item, list)` is true, call the function itself on that item and use what it returns.
An empty list makes no recursive call, which is the base case. For `largest_file`, keep the
largest size seen so far, starting from 0, and compare it with each file's size and with each
subfolder's largest file.
