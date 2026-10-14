#!/usr/bin/env bash
# Usage: bash solution.sh FSTAB BLKID
# Compares /etc/fstab with the output of blkid and prints what would go wrong at the next boot,
# or "fstab ok".
set -u

fstab=$1
blkid=$2

awk '
  # The value of KEY in a blkid line. The leading space keeps UUID from matching PARTUUID.
  function value_of(line, key) {
    if (match(line, " " key "=\"[^\"]*\""))
      return substr(line, RSTART + length(key) + 3, RLENGTH - length(key) - 4)
    return ""
  }

  # 1. BLKID, read first: "DEVICE: KEY="value" ..."
  FNR == NR {
    device = substr($1, 1, length($1) - 1)
    type_of[device] = value_of($0, "TYPE")
    uuid = value_of($0, "UUID")
    label = value_of($0, "LABEL")
    if (uuid != "") by_uuid[uuid] = device
    if (label != "") by_label[label] = device
    next
  }

  # 2. FSTAB
  /^[ \t]*(#|$)/ { next }
  {
    source = $1; mount = $2; fstype = $3; options = $4
    if (source ~ /^\/dev\// && source !~ /^\/dev\/(mapper|disk)\//) {
      print mount ": device name " source " can change, use UUID= or LABEL="
      problems++
    }

    found = ""
    if (source ~ /^UUID=/) {
      key = substr(source, 6)
      if (key in by_uuid) found = by_uuid[key]
    } else if (source ~ /^LABEL=/) {
      key = substr(source, 7)
      if (key in by_label) found = by_label[key]
    } else if (source ~ /^\/dev\// && source !~ /^\/dev\/disk\//) {
      if (source in type_of) found = source
    } else {
      next
    }

    if (found == "") {
      if (("," options ",") !~ /,(nofail|noauto),/) {
        print mount ": " source " not found, boot would stop"
        problems++
      }
    } else if (fstype != "auto" && fstype != type_of[found]) {
      print mount ": fstab says " fstype ", device has " type_of[found]
      problems++
    }
  }

  # 3.
  END { if (problems == 0) print "fstab ok" }
' "$blkid" "$fstab"
