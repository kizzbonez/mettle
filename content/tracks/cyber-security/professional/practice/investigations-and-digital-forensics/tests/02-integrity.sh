mkdir -p t2-evidence
printf 'USB stick image, exhibit 2\n' > "t2-evidence/USB stick 2.img"
printf 'logical extraction of phone PH-07' > t2-evidence/phone.tar
printf 'case notes, D. Osei\n' > t2-evidence/notes.txt
cat > t2-manifest.sha256 <<'EOF'
# exhibits for case IR-2026-051

5fa0568fd2f6b0de8ed9eb23b247259e0d6347aeb3902fad2998f9e710e97136  t2-evidence/USB stick 2.img
dbae93e7652a1265bac46c477831f5c6d3cf762488a74e8151f3945c2c662f5a  t2-evidence/phone.tar
# the notes were hashed when the case was opened
fd5f03ab145f873fa64d15e30d9d3842fa3dd43042330f09c07447f2b40df67d  t2-evidence/notes.txt
c159c0815dc74586c0ebacbd9256b1859dc8158acf5b7541eb472496b3b5ddfd  t2-evidence/gone.img
EOF
printf 'item,time,released_by,received_by,purpose,seal\n' > t2-custody.csv

actual=$(bash solution.sh t2-manifest.sha256 t2-custody.csv)
status=$?
assert_eq "$actual" "VERIFIED t2-evidence/USB stick 2.img
ALTERED t2-evidence/phone.tar
VERIFIED t2-evidence/notes.txt
MISSING t2-evidence/gone.img" \
  "a file name with spaces, comments and blank lines, a file missing its last newline and a missing file"
assert_eq "$status" "1" "exit status when a file is altered or missing"
