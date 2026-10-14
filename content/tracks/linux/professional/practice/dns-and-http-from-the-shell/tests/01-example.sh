actual=$(bash solution.sh data/hosts data/dig-answers.txt)
assert_eq "$actual" "db02.corp.example.com: /etc/hosts says 10.20.0.99, DNS says 10.20.0.14
www.corp.example.com: /etc/hosts says 10.20.0.15, DNS says 10.20.0.21 10.20.0.22" \
  "names where data/hosts disagrees with data/dig-answers.txt"
