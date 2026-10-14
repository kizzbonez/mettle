# Shopping List
#
# The tests run this script and type commands into it, one per line, ending
# with a line that says done.

items = []

while True:
    line = input().strip()
    if line == "done":
        break
    command, item = line.split()

    if command == "add":
        if item in items:
            print(f"already on the list: {item}")
        else:
            items.append(item)
    elif command == "urgent":
        if item in items:
            items.remove(item)
        items.insert(0, item)
    elif command == "got":
        if item in items:
            items.remove(item)
        else:
            print(f"not on the list: {item}")

if items:
    print(f"to buy ({len(items)}): {', '.join(items)}")
    print(f"by name: {', '.join(sorted(items))}")
else:
    print("nothing to buy")
