# Door Codes
#
# The tests run this script and type the codes into it: first a line with how
# many codes follow, then one code per line.

count = int(input())     # how many codes follow
accepted = 0
rejected = 0

for number in range(count):
    code = input().strip()
    reason = "ok"

    if not 4 <= len(code) <= 6:
        reason = "wrong length"
    else:
        for character in code:
            if character not in "0123456789":
                reason = "digits only"
                break

    if reason == "ok":
        if code.count(code[0]) == len(code):
            reason = "too easy"
        else:
            for i in range(1, len(code)):
                if int(code[i]) != int(code[i - 1]) + 1:
                    break
            else:
                reason = "too easy"

    print(f"{code}: {reason}")
    if reason == "ok":
        accepted += 1
    else:
        rejected += 1

print(f"ok: {accepted}, rejected: {rejected}")
