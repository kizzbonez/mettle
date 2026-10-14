# Photo Backup
#
# A folder is a list. Each of its items is either a file, given as its size
# in MB (an int), or another folder (a list). The tests call the three
# functions below directly, so keep their names and parameters. Replace each
# line `raise NotImplementedError` with the function's body; that line only
# stops the function with an error until you do (lesson 14 explains raise).

files_counted = 0


def count_files(folder):
    """Return how many files folder holds, at any depth."""
    # YOUR CODE (task 1): this version keeps its count in a global name. The
    # first call gives the right answer, but every later call goes on adding
    # to the old count. Rewrite it with a local count and return values, and
    # without `global`.
    global files_counted
    for item in folder:
        if isinstance(item, list):
            count_files(item)
        else:
            files_counted += 1
    return files_counted


def total_size(folder):
    """Return the total size in MB of the files in folder, at any depth."""
    raise NotImplementedError


def largest_file(folder):
    """Return the size of the largest file in folder, at any depth, or 0 if it holds no file."""
    raise NotImplementedError
