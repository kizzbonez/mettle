# Name Badges
#
# The tests run this script and type one line into it: a first name and a
# last name, in any mix of capitals, with extra spaces around and between
# them. The next line reads it; lesson 6 explains input().

entered = input()

first, last = entered.title().split()
full_name = first + " " + last
sorted_as = f"{last.upper()}, {first}"
initials = first[0] + "." + last[0] + "."
badge = f"|{full_name:^20}|"

print(full_name)
print(sorted_as)
print(initials)
print(badge)
