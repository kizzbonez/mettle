# Cinema Tickets
#
# The tests run this script and type two lines into it: the customer's age,
# a whole number, and the day of the week.

age = int(input())
day = input().strip().lower()

if not 0 <= age <= 120:
    print("invalid age")
else:
    if age < 3:
        category = "infant"
        price = 0
    elif age <= 15:
        category = "child"
        price = 6
    elif age <= 64:
        category = "adult"
        price = 10
    else:
        category = "senior"
        price = 7

    saver = day == "tuesday" and price > 0
    if saver:
        price = 5

    shown = "free" if price == 0 else price
    print(f"{category} ticket: {shown}")
    if saver:
        print("Tuesday saver")
