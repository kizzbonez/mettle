This sandbox has no `nano` and no `vi`, and the tests could not watch you type in an editor anyway.
So you replay the edits from the keys alone: for each file below, work out what the editor saved,
and make your script write exactly that into the file. **How it is judged:** the tests copy the
four original files from `data/` into a fresh folder, go into it, run

```bash
bash solution.sh
```

and then compare each file, character for character, with what the editor would have saved. A file
the editor never saved must stay exactly as it was. The script prints nothing and creates no other
files.

In the key lists, each line is one step and commas separate its keys. `Enter` and `Esc` are single
keys, `Ctrl+W` means holding Ctrl while pressing W, and `type ...` means typing that text exactly,
spaces included. Each editor starts with the cursor at the start of line 1.

**Worked example**, from the lesson. `app.conf` held `port=8080` and `host=example.org`, and these
keys in vi

```text
/8080, Enter
x, x, x, x
a, type 9090, Esc
G
o, type debug=false, Esc
:wq, Enter
```

saved `port=9090`, `host=example.org` and `debug=false`. A script recreates that file with:

```bash
echo "port=9090" > app.conf
echo "host=example.org" >> app.conf
echo "debug=false" >> app.conf
```

`>` empties the file before writing its first line, and `>>` adds each line after it.

1. **`playlist.txt`**, edited in vi. It held `06:00 news`, `06:05 weather`, `06:10 traffic` and
   `06:15 music`, one per line. Keys:

   ```text
   /weather, Enter
   dd
   G
   o, type 06:20 sport, Esc
   :wq, Enter
   ```

2. **`studio.conf`**, edited in nano. It held `mic=on`, `volume=7` and `lights=off`. Keys:

   ```text
   Ctrl+W, type mic, Enter
   Ctrl+K
   Ctrl+W, type lights, Enter
   Ctrl+U
   Ctrl+O, Enter
   Ctrl+X
   ```

3. **`notes.txt`**, edited in vi. It held `Guest on Friday: the harbour master` and
   `Remember the new jingle`. Keys:

   ```text
   dd
   o, type Bring biscuits, Esc
   :q, Enter
   :q!, Enter
   ```

4. **`rota.txt`**, edited in vi. It held `Mon Ana`, `Tue Ben` and `Wed Cy`. Keys:

   ```text
   /Ben, Enter
   yy
   G
   p
   1G
   dd
   u
   :wq, Enter
   ```

The visible test checks `playlist.txt`, which must end up as:

```text
06:00 news
06:10 traffic
06:15 music
06:20 sport
```

The hidden tests check the other three files, and that nothing else was printed or created.
