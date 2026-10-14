The editor holds a complete script of the same kind as `hello.py` in the lesson, and you change
one line of it. This lab is mostly about finding your way around the workspace: **Run** checks
your file, runs it and the visible test, and shows the result; **Submit** runs every test,
including the hidden ones. The tests run your file as a script, as `python solution.py` would,
and read what it prints.

1. Press **Run** before you change anything. The test fails, and that is expected. Read the
   result: it shows the lines the test expected and the lines your script really printed. One is
   missing.
2. Find the line marked `YOUR CODE`. It is `4 * 28`: Python works the number out and throws it
   away, because a script, unlike the REPL, does not show a value on its own. Change the line to
   `print(4 * 28)`. Change nothing else.
3. Press **Run** again. The script must now print exactly these four lines:

   ```text
   School trip to the science museum
   Pupils: 4 classes of 28
   112
   The buses leave at 8:30.
   ```

4. Press **Submit**. Three hidden tests look at the same output: the number on the third line,
   the other three lines as they were, and that Python still does the sum, so typing `112` by
   hand does not count.

**Try it:** delete the last `)` of the final line and press **Run**. You get
`SyntaxError: '(' was never closed`, and not even the first line is printed, because Python
checks the whole file before it runs any of it. Read the message: it names the file, the line,
and the problem. Then put the `)` back.
