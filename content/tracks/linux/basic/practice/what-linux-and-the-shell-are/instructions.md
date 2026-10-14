The editor holds a complete script, `solution.sh`, and you change one line of it. A script is a
file of commands: Bash runs them from top to bottom, exactly as if you typed each line at the
prompt. The tests run it with

```bash
bash solution.sh
```

and compare what it prints with the card below. This lab is mostly about finding your way around
the workspace: **Run** runs your script through the visible test and shows the result, and
**Submit** runs every test, including the hidden ones. The script runs in a container, the same
kind of Debian system the lesson describes.

1. Press **Run** before you change anything. The test fails, and that is expected. Read the
   result: it shows what your script printed and the card the test wanted instead.
2. Find the line marked `YOUR CODE`. Below it, `uname -s` asks for the kernel's name a second
   time. Change its option so that it prints the name of the operating system as a whole, as in
   the lesson. Change nothing else.
3. Press **Run** again. The script must now print exactly this card:

   ```text
   == Machine card ==
   Kernel:
   Linux
   Operating system:
   GNU/Linux
   Distribution:
   PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
   NAME="Debian GNU/Linux"
   ```

4. Press **Submit**. Three hidden tests look at the same card: the operating system's name, the
   kernel's name, and that the rest of the card is as it was.

**Try it:** change the option to `-x` and press **Run**. `uname` does not know that option and
says so in a message of its own, which the next lesson teaches you to read. Then put the right
option back.
