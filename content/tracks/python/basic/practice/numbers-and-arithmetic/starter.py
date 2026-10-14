# Bake Sale Boxes
#
# The tests run this script and type three lines into it: the number of
# cookies, how many fit in one box, and the price of one full box. The lines
# below read them; lesson 6 explains input(), int() and float().
#
# Write only where a comment says YOUR CODE, and leave the other lines as
# they are.

import math

cookies = int(input())      # how many cookies were baked, a whole number
box_size = int(input())     # how many cookies fit in one box, a whole number
price = float(input())      # the price of one full box, such as 2.5

# YOUR CODE: replace each 0 below with a calculation that uses the names above.
full_boxes = 0       # task 1: how many boxes can be filled completely
left_over = 0        # task 2: how many cookies are left over after that
boxes_needed = 0     # task 3: how many boxes it takes to pack every cookie
takings = 0          # task 4: the money from selling the full boxes, rounded to 2 decimal places

print("Full boxes:", full_boxes)
print("Left over:", left_over)
print("Boxes needed:", boxes_needed)
print("Takings:", takings)
