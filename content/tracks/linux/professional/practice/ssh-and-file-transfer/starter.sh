#!/usr/bin/env bash
# Usage: bash solution.sh CONFIG HOST
# Prints the hostname, user, port and proxyjump that ssh would use for HOST.
set -u

config=$1
host=$2

# The first value found for each keyword in a block that applies to $host.
hostname=''
user=''
port=''
proxyjump=''

# 1. Read CONFIG line by line: keyword and value, Host blocks, first value wins.
# YOUR CODE

# 2. Replace %h, fill in the defaults and print the four lines.
# YOUR CODE
