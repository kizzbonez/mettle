assert total_size([]) == 0, "an empty folder has a total of 0"
assert total_size([[], [[]]]) == 0, "folders that hold no files have a total of 0"
assert total_size([5, 7, 9]) == 21, "files directly in the folder are added up"
assert total_size([0, [0, [0]]]) == 0, "files of size 0 add nothing"
assert total_size([[1, 2], [3, [4, [5, [6]]]]]) == 21, "files at every depth are added up"

trip = [300, [150, [75]], 25]
assert total_size(trip) == 550, "a folder with files before, inside and after its subfolders"
assert total_size(trip) == 550, "calling total_size again gives the same total"
assert trip == [300, [150, [75]], 25], "total_size leaves the folder unchanged"
