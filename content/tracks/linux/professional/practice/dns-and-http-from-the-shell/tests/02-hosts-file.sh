cat > hosts.txt <<'EOF'
127.0.0.1	localhost
# 10.20.0.70	files01.corp.example.com   (old file server)
10.20.0.71	FILES01.Corp.Example.COM	files01
10.20.0.72	files01.corp.example.com
10.20.0.80 print01   # print01.corp.example.com moved to 10.20.0.81
fd00::33 db03.corp.example.com
10.20.0.33   db03 db03.corp.example.com
fd00::34 db04.corp.example.com
EOF
cat > answers.txt <<'EOF'
files01.corp.example.com. 600	IN	A	10.20.0.72
print01.corp.example.com. 600	IN	A	10.20.0.81
db03.corp.example.com.	600	IN	A	10.20.0.34
db04.corp.example.com.	600	IN	A	10.20.0.35
EOF
assert_eq "$(bash solution.sh hosts.txt answers.txt)" "files01.corp.example.com: /etc/hosts says 10.20.0.71, DNS says 10.20.0.72
db03.corp.example.com: /etc/hosts says 10.20.0.33, DNS says 10.20.0.34" \
  "comments, letter case, the first of several lines, aliases and IPv6 lines in the hosts file"
