# alert SRC DST SID ACTION SEVERITY SIGNATURE prints one eve.json alert line.
alert() {
  jq -nc --arg src "$1" --arg dst "$2" --argjson sid "$3" --arg action "$4" --argjson sev "$5" --arg sig "$6" \
    '{timestamp: "2026-11-02T03:00:00.000000+0000", event_type: "alert", src_ip: $src, src_port: 50000,
      dest_ip: $dst, dest_port: 443, proto: "TCP",
      alert: {action: $action, gid: 1, signature_id: $sid, rev: 1, signature: $sig, category: "Test", severity: $sev}}'
}
{
  alert 10.0.0.9 10.1.0.5 2000010 allowed 2 "LOCAL Beta"
  alert 10.0.0.10 10.1.0.5 2000010 allowed 2 "LOCAL Beta"
  alert 10.0.0.9 10.1.0.5 2000002 allowed 2 "LOCAL Alpha"
  alert 10.0.0.9 10.1.0.6 2000002 blocked 2 "LOCAL Alpha"
  alert 10.0.0.9 10.1.0.7 2000002 allowed 2 "LOCAL Alpha"
  alert 172.16.4.4 10.1.0.5 2000030 allowed 3 "LOCAL Gamma with  two spaces"
  alert 172.16.4.4 10.1.0.5 2000040 blocked 1 "LOCAL Delta"
  alert 172.16.4.4 10.1.0.5 2000040 blocked 1 "LOCAL Delta"
  alert 172.16.4.5 10.1.0.5 2000040 blocked 1 "LOCAL Delta"
  alert 2001:db8::7 10.1.0.5 2000050 blocked 4 "LOCAL Epsilon"
  echo '{"timestamp":"2026-11-02T03:00:01.000000+0000","event_type":"anomaly","src_ip":"10.0.0.9","dest_ip":"10.1.0.5","anomaly":{"type":"decode","event":"ipv4.trunc_pkt"}}'
  echo '{"timestamp":"2026-11-02T03:00:02.000000+0000","event_type":"http","src_ip":"10.0.0.9","dest_ip":"10.1.0.5","http":{"hostname":"shop.example","url":"/alert"}}'
} > t2-eve.json
: > t2-none.config

actual=$(bash solution.sh t2-eve.json t2-none.config)
status=$?
assert_eq "$actual" "FOLLOW-UP sev2 10.0.0.9 sid:2000002 x3 LOCAL Alpha
FOLLOW-UP sev2 10.0.0.10 sid:2000010 x1 LOCAL Beta
FOLLOW-UP sev2 10.0.0.9 sid:2000010 x1 LOCAL Beta
FOLLOW-UP sev3 172.16.4.4 sid:2000030 x1 LOCAL Gamma with  two spaces
BLOCKED sev1 172.16.4.4 sid:2000040 x2 LOCAL Delta
BLOCKED sev1 172.16.4.5 sid:2000040 x1 LOCAL Delta
BLOCKED sev4 2001:db8::7 sid:2000050 x1 LOCAL Epsilon" \
  "groups by signature ID and source, a mix of blocked and allowed is a follow-up, sort order, non-alert events ignored"
assert_eq "$status" "1" "exit status with follow-up groups"
