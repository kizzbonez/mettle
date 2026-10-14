#!/usr/bin/env bash
# Usage: bash solution.sh HOSTS ANSWERS
# Prints every name whose /etc/hosts address is not one of its DNS addresses,
# or "hosts and DNS agree".
set -u

hosts=$1
answers=$2

# 1. Read HOSTS: the first IPv4 address given for each name.
# 2. Read ANSWERS: the A records of each name, the CNAME aliases, and the order of the owners.
# 3. Compare and print, as the instructions describe.
# YOUR CODE
