# Door Codes
#
# The tests run this script and type the codes into it: first a line with how
# many codes follow, then one code per line. The loop below already reads
# each code and prints its line. Write only where a comment says YOUR CODE.

count = int(input())     # how many codes follow
accepted = 0
rejected = 0

for number in range(count):
    code = input().strip()
    reason = "ok"

    # YOUR CODE (tasks 1 to 3): check the rules in the order of the
    # instructions, and set reason to the first rule the code breaks.

    print(f"{code}: {reason}")

    # YOUR CODE (task 4): count the code as accepted or rejected.

print(f"ok: {accepted}, rejected: {rejected}")
