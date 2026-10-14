actual=$(bash solution.sh data/ssh_config web01)
assert_eq "$actual" "hostname web01.corp.example.com
user deploy
port 2222
proxyjump bastion" "where ssh web01 connects with data/ssh_config"
