#!/bin/sh
# Installs Skylark firmware 2.4.0 on a station board over USB.
set -eu
board=${1:-/dev/ttyUSB0}
echo "Flashing skylark-2.4.0.bin to $board"
skylark-flash --port "$board" --image skylark-2.4.0.bin --verify
echo "Done. Unplug the board and power it from the solar panel."
