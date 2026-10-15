# alert SRC DST SID ACTION SEVERITY SIGNATURE prints one eve.json alert line.
alert() {
  jq -nc --arg src "$1" --arg dst "$2" --argjson sid "$3" --arg action "$4" --argjson sev "$5" --arg sig "$6" \
    '{timestamp: "2026-11-03T01:00:00.000000+0000", event_type: "alert", src_ip: $src, src_port: 50000,
      dest_ip: $dst, dest_port: 443, proto: "TCP",
      alert: {action: $action, gid: 1, signature_id: $sid, rev: 1, signature: $sig, category: "Test", severity: $sev}}'
}
{
  alert 10.5.0.1 10.9.0.1 3000001 allowed 2 "LOCAL Suppressed everywhere"
  alert 10.5.0.2 10.9.0.2 3000001 allowed 2 "LOCAL Suppressed everywhere"
  alert 10.5.0.1 10.9.0.1 30000011 allowed 2 "LOCAL Longer SID"
  alert 10.5.0.1 10.9.0.1 3000002 allowed 3 "LOCAL Source suppressed"
  alert 10.5.0.10 10.9.0.1 3000002 allowed 3 "LOCAL Source suppressed"
  alert 10.9.0.1 10.5.0.1 3000002 allowed 3 "LOCAL Source suppressed"
  alert 10.5.0.3 10.9.0.8 3000003 blocked 1 "LOCAL Destination suppressed"
  alert 10.5.0.3 10.9.0.9 3000003 blocked 1 "LOCAL Destination suppressed"
  alert 10.9.0.8 10.5.0.3 3000003 blocked 1 "LOCAL Destination suppressed"
} > t3-eve.json
cat > t3-threshold.config <<'EOF'
# tuning review, November

suppress gen_id 1, sig_id 3000001
   # an indented comment line
suppress gen_id 1, sig_id 3000002, track by_src, ip 10.5.0.1
suppress gen_id 1, sig_id 3000003, track by_dst, ip 10.9.0.8

EOF
actual=$(bash solution.sh t3-eve.json t3-threshold.config)
assert_eq "$actual" "FOLLOW-UP sev2 10.5.0.1 sid:30000011 x1 LOCAL Longer SID
FOLLOW-UP sev3 10.5.0.10 sid:3000002 x1 LOCAL Source suppressed
FOLLOW-UP sev3 10.9.0.1 sid:3000002 x1 LOCAL Source suppressed
BLOCKED sev1 10.5.0.3 sid:3000003 x1 LOCAL Destination suppressed
BLOCKED sev1 10.9.0.8 sid:3000003 x1 LOCAL Destination suppressed" \
  "suppressions without a track, by_src and by_dst, matched on the whole signature ID and address"
