The editor holds a complete program of the same kind as the first one in the lesson, and you
change one line of it. This lab is mostly about finding your way around the workspace: **Run**
builds your code, runs the visible test and shows its output, and **Submit** runs every test,
including the hidden ones.

In the lesson, the statements of a program stand on their own in the file. Here they sit inside
a method named `Report`, in a class named `Honey`, because the tests call `Report` and read what
it prints. Lessons 8 and 11 explain these wrappers. For now, change only the line marked
`YOUR CODE` and leave everything else as it is.

1. Press **Run** before you change anything. The test fails, and that is expected. Read the
   result: it shows what the program printed and the line the test wanted instead.
2. Find the line marked `YOUR CODE`. A fourth hive has been emptied, and it gave 2.75 kg of
   honey. Change the list so that it holds all four hives. Change nothing else, because the
   program works out the number of hives and the total from the list.
3. Press **Run** again. The program must now print exactly this line:

   ```text
   4 hives gave 12.5 kg of honey
   ```

4. Press **Submit**. Three hidden tests look at the same line: the number of hives, the total,
   and that the rest of the line is as it was.

**Try it:** change `double total = 0;` to `double total = "zero";` and press **Run**. The
program is not built, and you get a compiler error instead, the same CS0029 error as in the
lesson. Read it from left to right: the file, the line and column in parentheses, the error
code, and the explanation in words. Then put the `0` back.
