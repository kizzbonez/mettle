# Shopping List
#
# The tests run this script and type commands into it, one per line, ending
# with a line that says done. The loop below already reads each command and
# splits it into the command word and the item. Write only where a comment
# says YOUR CODE.

items = []

while True:
    line = input().strip()
    if line == "done":
        break
    command, item = line.split()

    # YOUR CODE (tasks 1 to 3): carry out the command ("add", "urgent" or
    # "got") on the list `items`.

# YOUR CODE (task 4): print what is left to buy, as the instructions show.
