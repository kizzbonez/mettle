# Fun Run Results
#
# The tests run this script and type two lines into it: the runners' names,
# separated by spaces, then their finishing times in seconds, in the same
# order.

names = input().split()
times = [int(text) for text in input().split()]

if len(names) != len(times):
    print("names and times do not match")
elif not names:
    print("no runners")
else:
    results = sorted(zip(times, names))
    for position, (seconds, name) in enumerate(results, start=1):
        minutes, rest = divmod(seconds, 60)
        print(f"{position}. {name} {minutes}:{rest:02d}")

    fastest_time, fastest_name = results[0]
    slowest_time, slowest_name = results[-1]
    minutes, rest = divmod(slowest_time - fastest_time, 60)
    print(f"spread: {minutes}:{rest:02d}")
