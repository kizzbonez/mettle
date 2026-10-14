# Bill Splitter
#
# The tests run this script and type three lines into it: the bill, the tip
# in percent and the number of people sharing.

bill = float(input())
tip_percent = int(input())
people = int(input())

tip = bill * tip_percent / 100
total = bill + tip
each = total / people

print(f"Bill: {bill:.2f}", f"Tip rate: {tip_percent}%", f"People: {people}", sep=" | ")
print(f"Tip: {tip:.2f}")
print(f"Total: {total:.2f}")
print(f"Each pays: {each:.2f}")
