# Meter Reading
#
# The tests run this script and type two meter readings into it, one per
# line. Each `int(input())` takes the next line they typed and turns it into
# a whole number; lesson 6 explains input() and int(). For now, read it as
# "the next reading".

reading = int(input())   # the reading at the start of the month

# Keep the old reading under a second name before `reading` is rebound.
previous = reading

reading = int(input())   # the reading at the end of the month

print("Previous reading:", previous)
print("New reading:", reading)
print("Used this month:", reading - previous)
