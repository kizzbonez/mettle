actual=$(bash solution.sh data/monitor.log 10.40.0.1)
status=$?
assert_eq "$actual" "arp 10.40.0.1 changes=3 macs=00:0c:29:5e:a1:07,00:50:56:9a:10:01 gateway
arp 10.40.2.31 changes=1 macs=f8:75:a4:01:c3:9d,f8:75:a4:01:c3:9e
dhcp 00:0c:29:5e:a1:07 dropped=3
dhcp 3c:52:82:1a:2b:3c dropped=1" "findings in data/monitor.log with gateway 10.40.0.1"
assert_eq "$status" "2" "exit status when the gateway's address changed"
