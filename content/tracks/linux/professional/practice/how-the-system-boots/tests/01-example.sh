actual=$(bash solution.sh data/critical-chain.txt 200)
assert_eq "$actual" "88081 ms NetworkManager-wait-online.service
2291 ms kiosk-browser.service
305 ms NetworkManager.service
215 ms systemd-timesyncd.service" "units of at least 200 ms in data/critical-chain.txt"
