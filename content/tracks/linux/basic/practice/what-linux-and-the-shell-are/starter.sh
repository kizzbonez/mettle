#!/usr/bin/env bash
# Machine Card
#
# This file is a script: a list of commands that Bash runs from top to
# bottom, as if you typed each line at the prompt. The tests run it with
#
#     bash solution.sh
#
# and compare what it prints with the card in the instructions.
#
# A line that starts with # is a comment, a note for people: Bash skips it.
# (The first line, starting #!, says which program runs the file.)

echo "== Machine card =="

echo "Kernel:"
uname -s

echo "Operating system:"
# YOUR CODE: the next line asks for the kernel's name a second time.
# Change its option so that it prints the name of the whole operating
# system instead, as in the lesson. Change nothing else.
uname -s

echo "Distribution:"
head -n 2 /etc/os-release
