# Cinema Tickets
#
# The tests run this script and type two lines into it: the customer's age,
# a whole number, and the day of the week. Write only where a comment says
# YOUR CODE.

age = int(input())
day = input()

# YOUR CODE (task 1): if the age is not from 0 to 120, print "invalid age"
# and nothing else.

# YOUR CODE (task 2): choose the category and the price with if, elif and else.
category = "adult"
price = 10

# YOUR CODE (task 3): on a Tuesday, a ticket that is not free costs 5.

# YOUR CODE (task 4): print the ticket line, with "free" instead of a price
# of 0, and then the "Tuesday saver" line when the saver applied.
print(f"{category} ticket: {price}")
