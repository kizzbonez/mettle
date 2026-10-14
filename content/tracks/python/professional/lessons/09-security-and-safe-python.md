---
title: Security and Safe Python
summary: Avoid the classic security holes in Python code. Never evaluate or unpickle untrusted data, run programs without a shell, use secrets for anything secret, store passwords with a slow salted hash, compare secrets in constant time, keep user paths inside their folder, create temporary files safely, validate input, and protect the supply chain.
minutes: 40
objectives:
  - Explain why eval, exec and pickle on untrusted data allow code execution, and use safe alternatives
  - Run external programs with subprocess and an argument list instead of a shell string
  - Generate tokens with secrets, store passwords with hashlib.scrypt and a salt, and verify them with hmac.compare_digest
  - Stop path traversal, create temporary files safely, and reduce dependency risks
---

## Outline

1. Trust boundaries
2. `eval`, `exec` and `pickle`
3. Running other programs
4. Randomness for secrets
5. Storing passwords
6. Paths and temporary files
7. Validating input
8. Dependencies and the supply chain

## Trust boundaries

Most security bugs come from treating data as if it were code, or as if it were well-behaved. A
**trust boundary** is where data enters your program from somewhere you do not control: command
arguments, files, environment variables, network requests, uploaded names, even your database if
others write to it. Everything crossing it is **untrusted** until checked. The rules in this
lesson are what to do at that boundary.

## `eval`, `exec` and `pickle`

`eval(text)` evaluates an expression and `exec(text)` runs statements. Given text from a user,
they run whatever the user wrote, with your program's permissions. The pickle format can do the
same: it stores instructions for rebuilding objects, and an object can ask to be rebuilt by
calling any function.

```python
import ast
import pickle

user_text = "__import__('os').getcwd()"
print(eval(user_text))                      # runs whatever the user typed

print(ast.literal_eval("[1, 2.5, 'three', {'four': None}]"))
try:
    ast.literal_eval(user_text)
except ValueError as error:
    print("ValueError:", str(error).split(":")[0])


class Innocent:
    def __reduce__(self):
        return (print, ("this ran while unpickling",))


payload = pickle.dumps(Innocent())
pickle.loads(payload)
```

```text
/tmp
[1, 2.5, 'three', {'four': None}]
ValueError: malformed node or string on line 1
this ran while unpickling
```

The "user" called `os.getcwd()`; it could as easily have deleted files. The payload printed, but
`__reduce__` could have returned `os.system` and a command. The documentation is blunt: the pickle
module is not secure; only unpickle data you trust. Instead:

- For numbers, use `int()` or `Decimal()`; for structured data, `json.loads`.
- `ast.literal_eval` accepts only Python literals (numbers, strings, lists, dicts, tuples, sets,
  `None`, booleans), so it cannot call anything. For untrusted input, also limit its size.
- To exchange objects between programs, use JSON. If you must store pickles, sign them with
  `hmac` and refuse any whose signature does not match.

## Running other programs

`subprocess.run` starts another program. Pass the command as a **list** of arguments. With
`shell=True` and a string, a shell (`/bin/sh` or `cmd.exe`) parses the line, so characters such as
`;`, `|`, `&&` and `$( )` in data become commands, which is **shell injection**:

```python
import subprocess
from pathlib import Path

Path("notes.txt").write_text("hello\n")
name = "notes.txt; echo INJECTED"         # a file name chosen by an attacker

unsafe = subprocess.run(f"wc -c {name}", shell=True, capture_output=True, text=True)
print("shell=True:", unsafe.stdout.split("\n"))

safe = subprocess.run(["wc", "-c", name], capture_output=True, text=True)
print("list:", safe.returncode, safe.stderr.strip())

try:
    subprocess.run(["wc", "-c", name], capture_output=True, text=True, check=True, timeout=5)
except subprocess.CalledProcessError as error:
    print("CalledProcessError:", error.returncode)
```

```text
shell=True: ['6 notes.txt', 'INJECTED', '']
list: 1 wc: 'notes.txt; echo INJECTED': No such file or directory
CalledProcessError: 1
```

With a list there is no shell: the whole name reached `wc` as one argument, and `wc` reported a
missing file. Add `check=True` so a failing command raises `CalledProcessError`, and `timeout=` so
a hung one raises `TimeoutExpired`. If a value could start with `-`, put `--` before it so the
program does not read it as an option.

## Randomness for secrets

The `random` module is a **pseudo-random** generator meant for simulations: from its state, every
future number can be predicted. After `random.seed(2026)` it always produces
`[1, 5, 8, 8, 1, 3]`. For tokens, passwords, reset links and keys use `secrets`, which reads the
operating system's cryptographic source: `secrets.token_urlsafe(32)` returns 32 random bytes as
43 URL-safe characters, `secrets.token_hex`, `secrets.choice` and `secrets.randbelow` cover the
rest. The documentation suggests 32 bytes as enough for typical uses.

## Storing passwords

Never store a password, encrypted or not; store a **hash** that lets you check one. A fast hash
such as `hashlib.sha256` lets an attacker who steals the table try billions of guesses per second.
Password hashing needs three things: a random **salt** per user, so equal passwords look
different and precomputed tables are useless; a deliberately **slow, memory-hungry** function;
and a **constant-time comparison**. The standard library has `hashlib.scrypt`:

```python
import hashlib
import hmac
import secrets

N, R, P = 2**17, 8, 1           # OWASP's suggested scrypt cost: 128 MiB of memory
MAXMEM = 256 * 1024 * 1024


def hash_password(password):
    salt = secrets.token_bytes(16)
    key = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, maxmem=MAXMEM)
    return salt, key


def check_password(password, salt, key):
    candidate = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, maxmem=MAXMEM)
    return hmac.compare_digest(candidate, key)


salt, key = hash_password("correct horse battery staple")
print(len(salt), len(key))
print(check_password("correct horse battery staple", salt, key))
print(check_password("Correct horse battery staple", salt, key))
```

```text
16 64
True
False
```

Store the salt, the parameters and the key together. `hmac.compare_digest` takes the same time
however many leading bytes match, whereas `==` stops at the first difference, and that timing
difference can leak a secret byte by byte. The OWASP cheat sheet ranks Argon2id (a third-party
package) first and scrypt second; `hashlib.pbkdf2_hmac` with 600,000 iterations of SHA-256 is the
choice when FIPS rules apply.

## Paths and temporary files

A user-supplied file name such as `../../etc/passwd` can climb out of the folder you meant, which
is **path traversal**. Joining an absolute path replaces the base entirely:
`Path("/srv/uploads") / "/etc/passwd"` is `/etc/passwd`. Resolve the result and check that it
stays inside:

```python
import tempfile
from pathlib import Path


def safe_path(base, user_name):
    base = base.resolve()
    target = (base / user_name).resolve()
    if not target.is_relative_to(base):
        raise ValueError(f"{user_name!r} is outside the upload folder")
    return target


with tempfile.TemporaryDirectory() as folder:
    uploads = Path(folder)
    (uploads / "report.txt").write_text("quarterly figures\n")
    print(safe_path(uploads, "report.txt").read_text(), end="")
    for attempt in ["../../etc/passwd", "/etc/passwd", "sub/../../secret"]:
        try:
            safe_path(uploads, attempt)
        except ValueError as error:
            print("refused:", error)
print("folder still exists:", uploads.exists())
```

```text
quarterly figures
refused: '../../etc/passwd' is outside the upload folder
refused: '/etc/passwd' is outside the upload folder
refused: 'sub/../../secret' is outside the upload folder
folder still exists: False
```

`resolve()` also follows symbolic links, so a link pointing outside is caught too. The
`tempfile` module creates temporary files and folders with unpredictable names, readable only by
your user, and `TemporaryDirectory` removes the folder and its contents at the end of the `with`.
Never build temporary names yourself (`/tmp/report.txt`): another user can create that path
first and make you write through it.

## Validating input

- **Allow-list, do not deny-list.** Accept what matches a known-good pattern (`isdigit`, a set of
  choices, `fullmatch` against a pattern) instead of trying to list every bad character.
- **Parse into types early.** Convert text to `int`, `Decimal`, `date` at the boundary, and reject
  failures with a clear message.
- **Limit sizes.** Cap upload sizes, line lengths and nesting depth; huge inputs are a
  denial-of-service attack.
- **Keep error messages for users vague and logs precise.** Do not show tracebacks or secrets to
  users, and never log passwords or tokens.

## Dependencies and the supply chain

Every package you install runs code with your permissions, and installing a source distribution
can run its build code. Attackers publish **typosquats** (`reqeusts`) and take over abandoned
projects. Pin exact versions in a lock file (lesson 1), and let pip verify the files themselves
with hashes:

```text
rich==14.1.0 \
    --hash=sha256:<hash of the wheel you reviewed>
```

```console
$ python -m pip install --require-hashes --only-binary :all: -r requirements.txt
```

`--require-hashes` refuses anything without a matching hash, and `--only-binary :all:` refuses
source distributions. Check new dependencies before adding them (spelling, maintainers, activity),
keep them few, and scan regularly with a tool such as `pip-audit`, which reports installed versions
with known vulnerabilities.

## Common mistakes

- **`eval(input())` as a calculator or parser.** Use `int`, `float`, `json.loads` or
  `ast.literal_eval`.
- **`subprocess.run(f"convert {name} out.png", shell=True)`.** Use a list:
  `["convert", name, "out.png"]`.
- **`random.choice` for a reset code.** Use `secrets.choice` or `secrets.token_urlsafe`.
- **`sha256(password)` without a salt.** Use `scrypt` with a random salt.
- **`if token == expected:` for secrets.** Use `hmac.compare_digest(token, expected)`.
- **Forgetting `maxmem` with strong scrypt settings.** OpenSSL's default limit is 32 MiB, so
  `n=2**17, r=8` raises `ValueError: [digital envelope routines] memory limit exceeded`.

## Practice

1. Generate a 12-character temporary password from letters and digits, safely.
2. Run `git log -n 5 --format=%s` on a user-chosen file, without a shell.
3. Sign a message with HMAC-SHA256 and verify the tag.

### Answers

```python
import hashlib
import hmac
import secrets
import string

alphabet = string.ascii_letters + string.digits
password = "".join(secrets.choice(alphabet) for _ in range(12))
print(len(password))

command = ["git", "log", "-n", "5", "--format=%s", "--", "user file.txt"]

key = secrets.token_bytes(32)
tag = hmac.new(key, b"order 1042 paid", hashlib.sha256).hexdigest()
check = hmac.new(key, b"order 1042 paid", hashlib.sha256).hexdigest()
print(hmac.compare_digest(tag, check))
```

```text
12
True
```

`--` ends git's options, so a file named `--output=x` cannot change what git does. The command
list is ready for `subprocess.run(command, capture_output=True, text=True, check=True)`.

## Key takeaways

- Data across a trust boundary is untrusted: never `eval`, `exec` or unpickle it.
- `subprocess.run` with an argument list, no shell, `check=True` and a `timeout`.
- `secrets` for anything secret; `random` is predictable.
- Passwords: `hashlib.scrypt` with a random salt, verified with `hmac.compare_digest`.
- Resolve user paths and check `is_relative_to`; create temporary files with `tempfile`.
- Pin and hash dependencies, and audit them.

## Further reading

- [pickle: security warning](https://docs.python.org/3.15/library/pickle.html)
- [subprocess: Security considerations](https://docs.python.org/3.15/library/subprocess.html#security-considerations)
- [secrets: Generate secure random numbers](https://docs.python.org/3.15/library/secrets.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
