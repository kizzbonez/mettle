const sign = runScript();
const lines = sign.out.split("\n");
check.equal(lines[0], "Welcome to Riverside Pool", "the first line of the sign");
check.equal(lines[3], "Please shower before you swim", "the last line of the sign");
check.equal(lines.length - 1, 4, "the number of lines printed");
check.equal(sign.err, "", "nothing printed as an error");
check.equal(sign.code, 0, "the exit code of the program");
