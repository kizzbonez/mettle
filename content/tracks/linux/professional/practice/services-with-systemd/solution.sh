#!/usr/bin/env bash
# Usage: bash solution.sh UNIT_FILE
# Reviews one service unit and prints its problems, or "no problems found".
# Exits with status 1 if there was a problem, 0 if not.
set -u

unit_file=$1

awk '
  function trim(s) {
    gsub(/^[ \t]+|[ \t]+$/, "", s)
    return s
  }
  # A command run by a shell on purpose: sh -c, bash -c, /bin/sh -c ...
  function via_shell(command,    words) {
    split(command, words, " ")
    return words[1] ~ /(^|\/)(ba)?sh$/ && words[2] == "-c"
  }

  { line = trim($0) }
  line == "" || line ~ /^[#;]/ { next }
  line ~ /^\[.*\]$/ { section = line; next }
  {
    eq = index(line, "=")
    if (eq == 0) next
    key = trim(substr(line, 1, eq - 1))
    value = trim(substr(line, eq + 1))
  }
  section == "[Service]" && key == "ExecStart" && value != "" { execs[++n] = value }
  section == "[Service]" && key == "User" { user = value }
  section == "[Service]" && key == "Restart" { restart = value }
  section == "[Install]" && key == "WantedBy" { wanted = (value == "" ? "" : wanted " " value) }

  END {
    problems = 0
    for (i = 1; i <= n; i++) {
      if (execs[i] ~ /[|<>&]/ && !via_shell(execs[i])) {
        print "shell syntax in ExecStart: " execs[i]
        problems++
      }
    }
    if (user == "") { print "runs as root: no User="; problems++ }
    if (restart == "" || restart == "no") { print "not restarted after a crash: Restart=no"; problems++ }
    if (wanted == "") { print "cannot be enabled: no WantedBy= in [Install]"; problems++ }
    if (problems == 0) print "no problems found"
    exit (problems > 0)
  }
' "$unit_file"
