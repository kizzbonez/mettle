#!/usr/bin/env bash
# Opening Checklist: turns the exit status of two checks into reminders.

echo "Opening checklist"

oven-check
echo "oven status: $?"

# && runs the echo only when the check succeeded (exit status 0);
# || runs it only when the check failed.
oven-check && echo "Oven: start the bread"
till-check || echo "Till: fetch change from the bank"

echo "Checklist done"
