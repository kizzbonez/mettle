# The examples from the instructions. The test calls your functions directly.
phone = [120, [45, 3, [800, 2]], [], [[16]]]

assert count_files(phone) == 6, "count_files of the example phone"
assert count_files(phone) == 6, "count_files of the example phone a second time gives the same answer"
assert total_size(phone) == 986, "total_size of the example phone"
assert largest_file(phone) == 800, "largest_file of the example phone"
assert largest_file([[], []]) == 0, "largest_file of folders that hold no file"
