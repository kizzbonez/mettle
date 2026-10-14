# Meter Reading
#
# The tests run this script and type two meter readings into it, one per
# line. Each `int(input())` takes the next line they typed and turns it into
# a whole number; lesson 6 explains input() and int(). For now, read it as
# "the next reading".
#
# Write only where a comment says YOUR CODE, and leave the other lines as
# they are.

reading = int(input())   # the reading at the start of the month

# YOUR CODE (task 1): the line after this comment rebinds `reading` to the
# new reading. Before that happens, bind a second name, `previous`, to the
# object `reading` refers to now, so that the old reading is not lost.


reading = int(input())   # the reading at the end of the month

print("Previous reading:", previous)
print("New reading:", reading)
# YOUR CODE (task 2): print "Used this month:" and the number of units used,
# which is the new reading minus the previous one.
