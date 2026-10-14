cat > hosts.txt <<'EOF'
10.30.0.11 api.lab.example.org
10.30.0.50 cdn.lab.example.org
10.30.0.60 Docs.Lab.Example.Org
10.30.0.70 old.lab.example.org
10.30.0.26 mail.lab.example.org
EOF
cat > answers.txt <<'EOF'
API.LAB.EXAMPLE.ORG.	300	IN	A	10.30.0.10
API.LAB.EXAMPLE.ORG.	300	IN	A	10.30.0.11
api.lab.example.org.	300	IN	AAAA	2001:db8:30::11
lab.example.org.	3600	IN	MX	10 mail.lab.example.org.
lab.example.org.	3600	IN	TXT	"v=spf1 ip4:10.30.0.0/24 ~all"
cdn.lab.example.org.	300	IN	CNAME	edge.lab.example.org.
edge.lab.example.org.	300	IN	CNAME	pop-ams.edge.example.net.
pop-ams.edge.example.net. 60	IN	A	192.0.2.50
pop-ams.edge.example.net. 60	IN	A	192.0.2.51
docs.lab.example.org.	300	IN	A	10.30.0.60
old.lab.example.org.	300	IN	CNAME	gone.lab.example.org.
MAIL.LAB.EXAMPLE.ORG.	300	IN	A	10.30.0.25
EOF
assert_eq "$(bash solution.sh hosts.txt answers.txt)" "cdn.lab.example.org: /etc/hosts says 10.30.0.50, DNS says 192.0.2.50 192.0.2.51
mail.lab.example.org: /etc/hosts says 10.30.0.26, DNS says 10.30.0.25" \
  "several A records, other record types, a chain of aliases, an alias with no address, and upper-case answers"
