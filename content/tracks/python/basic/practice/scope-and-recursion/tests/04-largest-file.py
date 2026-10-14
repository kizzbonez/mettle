assert largest_file([]) == 0, "an empty folder has no largest file, so the answer is 0"
assert largest_file([[[]]]) == 0, "nested empty folders have no largest file"
assert largest_file([42]) == 42, "a folder with a single file"
assert largest_file([0, [0]]) == 0, "files of size 0 only"
assert largest_file([900, [10, [20]]]) == 900, "the largest file can be at the top level"
assert largest_file([10, [20, [30, [999]]], 40]) == 999, "the largest file can be deep inside the folders"
assert largest_file([[5], 5, [[5]]]) == 5, "several files share the largest size"

holiday = [[3, 8], [[12, 1]], 7]
assert largest_file(holiday) == 12, "the largest file of a folder whose subfolders come first"
assert holiday == [[3, 8], [[12, 1]], 7], "largest_file leaves the folder unchanged"
