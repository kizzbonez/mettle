# Fun Run Results
#
# The tests run this script and type two lines into it: the runners' names,
# separated by spaces, then their finishing times in seconds, in the same
# order. The two lines below read them into lists. Write only where a
# comment says YOUR CODE.

names = input().split()                           # such as ['Ada', 'Bo', 'Cy']
times = [int(text) for text in input().split()]   # such as [1520, 1495, 1610]

# YOUR CODE (task 1): handle a different number of names and times, and no
# runners at all.

# YOUR CODE (task 2): pair each time with its name in a tuple, using zip, and
# sort the pairs so the fastest comes first.

# YOUR CODE (task 3): print one numbered line per runner, using enumerate, with
# the time as minutes:seconds from divmod.

# YOUR CODE (task 4): print the spread between the slowest and the fastest.
