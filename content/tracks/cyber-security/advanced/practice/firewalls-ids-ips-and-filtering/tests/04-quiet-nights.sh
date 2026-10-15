: > t4-empty.json
: > t4-none.config
actual=$(bash solution.sh t4-empty.json t4-none.config)
status=$?
assert_eq "$actual" "" "an empty eve.json gives no lines"
assert_eq "$status" "0" "exit status with no alerts"

{
  echo '{"timestamp":"2026-11-04T02:00:00.000000+0000","event_type":"alert","src_ip":"198.51.100.9","src_port":41000,"dest_ip":"10.20.0.15","dest_port":443,"proto":"TCP","alert":{"action":"blocked","gid":1,"signature_id":1000001,"rev":2,"signature":"LOCAL Path traversal in URI","category":"Web Application Attack","severity":1}}'
  echo '{"timestamp":"2026-11-04T02:00:05.000000+0000","event_type":"flow","src_ip":"198.51.100.9","src_port":41000,"dest_ip":"10.20.0.15","dest_port":443,"proto":"TCP","flow":{"state":"closed"}}'
  echo '{"timestamp":"2026-11-04T02:10:00.000000+0000","event_type":"alert","src_ip":"10.20.0.40","src_port":38000,"dest_ip":"10.20.0.15","dest_port":443,"proto":"TCP","alert":{"action":"allowed","gid":1,"signature_id":1000009,"rev":1,"signature":"LOCAL Request for /admin path","category":"Potentially Bad Traffic","severity":3}}'
} > t4-eve.json
actual=$(bash solution.sh t4-eve.json data/threshold.config)
status=$?
assert_eq "$actual" "BLOCKED sev1 198.51.100.9 sid:1000001 x1 LOCAL Path traversal in URI" \
  "a night where the only allowed alert is suppressed"
assert_eq "$status" "0" "exit status when every group was blocked"

printf '# nothing suppressed yet\n\n' > t4-comments.config
grep '1000009' t4-eve.json > t4-only-allowed.json
actual=$(bash solution.sh t4-only-allowed.json t4-comments.config)
status=$?
assert_eq "$actual" "FOLLOW-UP sev3 10.20.0.40 sid:1000009 x1 LOCAL Request for /admin path" \
  "a suppression file with only a comment and a blank line"
assert_eq "$status" "1" "exit status with one follow-up group"
