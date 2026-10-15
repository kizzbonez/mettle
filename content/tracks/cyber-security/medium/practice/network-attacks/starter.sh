#!/usr/bin/env bash
# Usage: bash solution.sh LOG GATEWAY
# Finds ARP spoofing (arpwatch) and rogue DHCP servers (DHCP snooping drops) in a syslog file.
set -u

log=$1
gateway=$2

# One awk program can do it all; gawk is available.
# 1. A function that writes a MAC address as six lower-case two-digit groups joined by colons,
#    from arpwatch's 0:c:29:5e:a1:7 or a switch's 000c.295e.a107.
# 2. For "arpwatch: changed ethernet address IP NEW (OLD)" and "arpwatch: flip flop IP NEW (OLD)":
#    count the events per IP and remember every MAC each IP was seen with.
# 3. For DHCP_SNOOPING_UNTRUSTED_PORT lines with message type DHCPOFFER or DHCPACK:
#    count them per "MAC sa" address.
# 4. Print the arp lines, then the dhcp lines, each in order of first appearance, or
#    "no spoofing seen". Exit 2 if the gateway changed, 1 for other findings, 0 for none.
# YOUR CODE
