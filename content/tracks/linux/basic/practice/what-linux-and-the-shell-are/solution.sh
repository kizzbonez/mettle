#!/usr/bin/env bash
# Machine Card: prints what this computer runs.

echo "== Machine card =="

echo "Kernel:"
uname -s

echo "Operating system:"
# -s asks for the kernel's name, -o for the name of the operating system.
uname -o

echo "Distribution:"
head -n 2 /etc/os-release
