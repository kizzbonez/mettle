# Bake Sale Boxes
#
# The tests run this script and type three lines into it: the number of
# cookies, how many fit in one box, and the price of one full box. The lines
# below read them; lesson 6 explains input(), int() and float().

import math

cookies = int(input())      # how many cookies were baked, a whole number
box_size = int(input())     # how many cookies fit in one box, a whole number
price = float(input())      # the price of one full box, such as 2.5

full_boxes = cookies // box_size
left_over = cookies % box_size
boxes_needed = math.ceil(cookies / box_size)
takings = round(full_boxes * price, 2)

print("Full boxes:", full_boxes)
print("Left over:", left_over)
print("Boxes needed:", boxes_needed)
print("Takings:", takings)
