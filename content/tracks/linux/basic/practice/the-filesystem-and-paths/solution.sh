#!/usr/bin/env bash
# Prop Store Tour: shows where you are and what is around you.

echo "== here =="
# -A shows hidden names but leaves out . and ..
ls -A

echo "== one level up =="
# .. is the parent directory; -F puts / after folder names.
ls -F ..

echo "== top =="
# Two levels up, then the absolute path of the new working directory.
cd ../..
pwd
ls -F
