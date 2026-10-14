# Files exactly at each limit, and one byte over it.
head -c 100 /dev/zero | tr '\0' 'a' > at-limit.txt
head -c 101 /dev/zero | tr '\0' 'a' > over-limit.txt
head -c 101 /dev/zero | tr '\0' 'a' > over-limit.md
head -c 1000 /dev/zero > at-limit.png
head -c 1001 /dev/zero > over-limit.jpg

# Each row is NAME:EXPECTED OUTPUT:EXPECTED STATUS.
for row in 'at-limit.txt:accepted: text:0' 'over-limit.txt:rejected: too large:1' \
           'over-limit.md:rejected: too large:1' 'at-limit.png:accepted: image:0' \
           'over-limit.jpg:rejected: too large:1'; do
  name=$(echo "$row" | cut -d: -f1)
  want_out=$(echo "$row" | cut -d: -f2-3)
  want_status=$(echo "$row" | cut -d: -f4)
  out=$(bash solution.sh "$name" 2> /dev/null)
  status=$?
  assert_eq "$out" "$want_out" "what is printed for $name ($(wc -c < "$name") bytes)"
  assert_eq "$status" "$want_status" "exit status for $name ($(wc -c < "$name") bytes)"
done
