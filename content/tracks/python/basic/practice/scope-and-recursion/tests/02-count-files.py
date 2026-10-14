assert count_files([]) == 0, "an empty folder holds no files"
assert count_files([[], [[]], [[], []]]) == 0, "folders inside folders, all empty, hold no files"
assert count_files([5, 7, 9]) == 3, "files directly in the folder"
assert count_files([[1, 2], [3, [4, [5, [6]]]]]) == 6, "files at several depths are all counted"

album = [10, [20, 30], [[40]]]
answers = [count_files(album) for attempt in range(4)]
assert answers == [4, 4, 4, 4], "calling count_files again and again gives the same answer every time"
assert count_files([1]) == 1, "a call after earlier calls on other folders starts its count from nothing"

deep = [1]
for level in range(200):
    deep = [deep, 1]
assert count_files(deep) == 201, "a folder nested 200 levels deep"
