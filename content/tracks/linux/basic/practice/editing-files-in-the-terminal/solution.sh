#!/usr/bin/env bash
# Keystroke Replay: write each file as the editor saved it.

# 1. dd removed the weather line; o added a line below the last one.
echo "06:00 news" > playlist.txt
echo "06:10 traffic" >> playlist.txt
echo "06:15 music" >> playlist.txt
echo "06:20 sport" >> playlist.txt

# 2. Ctrl+K cut mic=on; Ctrl+U pasted it above lights=off; Ctrl+O saved.
echo "volume=7" > studio.conf
echo "mic=on" >> studio.conf
echo "lights=off" >> studio.conf

# 3. :q was refused and :q! threw the changes away, so notes.txt was never
#    saved: it stays as it is, and the script does not touch it.

# 4. yy and p added a copy of the Ben line at the end; dd deleted the first
#    line, but u brought it back before :wq saved.
echo "Mon Ana" > rota.txt
echo "Tue Ben" >> rota.txt
echo "Wed Cy" >> rota.txt
echo "Tue Ben" >> rota.txt
