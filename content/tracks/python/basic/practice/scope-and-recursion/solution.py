# Photo Backup
#
# A folder is a list. Each of its items is either a file, given as its size
# in MB (an int), or another folder (a list). The tests call the three
# functions below directly.


def count_files(folder):
    """Return how many files folder holds, at any depth."""
    count = 0
    for item in folder:
        if isinstance(item, list):
            count += count_files(item)
        else:
            count += 1
    return count


def total_size(folder):
    """Return the total size in MB of the files in folder, at any depth."""
    total = 0
    for item in folder:
        if isinstance(item, list):
            total += total_size(item)
        else:
            total += item
    return total


def largest_file(folder):
    """Return the size of the largest file in folder, at any depth, or 0 if it holds no file."""
    largest = 0
    for item in folder:
        if isinstance(item, list):
            size = largest_file(item)
        else:
            size = item
        if size > largest:
            largest = size
    return largest
