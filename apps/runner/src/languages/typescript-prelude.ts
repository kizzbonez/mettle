/**
 * Files the TypeScript harness writes next to the learner's `solution.ts`: the test helpers,
 * the script that runs one compiled test, and the compiler settings.
 */

/** `lab_helpers.ts`: what a test body can use, imported into every test for it. */
export const TS_HELPERS = `import { spawnSync } from "node:child_process";
import { inspect, isDeepStrictEqual } from "node:util";

/** Stops the test. MESSAGE is the one line a hidden test shows; DETAIL only a visible test. */
export function fail(message: string, detail = ""): never {
  process.stderr.write(\`FAIL: \${message}\\n\${detail}\`);
  process.exit(1);
}

type ErrorClass = abstract new (...args: never[]) => Error;

function thrownBy(error: unknown, kind: ErrorClass | undefined, message: string): Error {
  if (!(error instanceof Error)) fail(message, \`  thrown: \${inspect(error)}\\n\`);
  const thrown = \`\${error.name}: \${error.message}\`;
  if (kind && !(error instanceof kind)) fail(message, \`  expected: \${kind.name}\\n  thrown:   \${thrown}\\n\`);
  return error;
}

export const check = {
  /** Deep equality: arrays, objects, Maps and Sets compare by content. */
  equal<T>(actual: T, expected: T, message: string): void {
    if (!isDeepStrictEqual(actual, expected)) {
      fail(message, \`  expected: \${inspect(expected, { depth: 6 })}\\n  actual:   \${inspect(actual, { depth: 6 })}\\n\`);
    }
  },
  true(condition: unknown, message: string): void {
    if (!condition) fail(message);
  },
  /** Runs BODY, which must throw (an instance of KIND, when given); returns what it threw. */
  throws(body: () => unknown, message: string, kind?: ErrorClass): Error {
    try {
      body();
    } catch (error) {
      return thrownBy(error, kind, message);
    }
    return fail(message, "  nothing was thrown\\n");
  },
  /** Awaits BODY, which must reject (with an instance of KIND, when given); returns the error. */
  async rejects(body: () => Promise<unknown>, message: string, kind?: ErrorClass): Promise<Error> {
    try {
      await body();
    } catch (error) {
      return thrownBy(error, kind, message);
    }
    return fail(message, "  the promise did not reject\\n");
  },
};

function capture(): { done: () => string } {
  const write = process.stdout.write.bind(process.stdout);
  let printed = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    printed += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString();
    return true;
  }) as typeof process.stdout.write;
  return {
    done: () => {
      process.stdout.write = write;
      return printed;
    },
  };
}

/** Calls BODY and returns what it printed with console.log or process.stdout. */
export function printedBy(body: () => void): string {
  const output = capture();
  try {
    body();
  } catch (error) {
    output.done();
    throw error;
  }
  return output.done();
}

/** Awaits BODY and returns what it printed. */
export async function printedByAsync(body: () => Promise<void>): Promise<string> {
  const output = capture();
  try {
    await body();
  } catch (error) {
    output.done();
    throw error;
  }
  return output.done();
}

export interface Ran {
  out: string;
  err: string;
  code: number | null;
}

/** Runs the learner's file as a program, as "node solution.js ARGS" would, typing STDIN into it. */
export function runScript(stdin = "", args: string[] = []): Ran {
  const done = spawnSync(process.execPath, ["--enable-source-maps", "out/solution.js", ...args], { input: stdin, encoding: "utf8" });
  return { out: done.stdout, err: done.stderr, code: done.status };
}
`;

/** `lab_run.mjs`: imports one compiled test and prints the nonce only if it ran to the end. */
export function labRunner(nonce: string): string {
  return [
    'import { pathToFileURL } from "node:url";',
    'try {',
    '  await import(pathToFileURL(process.argv[2]).href);',
    '} catch (error) {',
    '  const name = error instanceof Error ? error.name : typeof error;',
    '  const message = error instanceof Error ? error.message : String(error);',
    '  process.stderr.write(`FAIL: unexpected ${name}: ${message}\\n`);',
    '  if (error instanceof Error && error.stack) process.stderr.write(`${error.stack}\\n`);',
    '  process.exit(1);',
    '}',
    `process.stdout.write("\\n${nonce}\\n");`,
    '',
  ].join('\n');
}

/** Strict compiler settings shared by the learner's file and every test. */
export const TS_CONFIG_BASE = JSON.stringify(
  {
    compilerOptions: {
      target: 'es2024',
      lib: ['es2024'],
      module: 'nodenext',
      moduleResolution: 'nodenext',
      strict: true,
      noEmitOnError: true,
      skipLibCheck: true,
      sourceMap: true,
      types: ['node'],
      typeRoots: ['/usr/local/lib/node_modules/@types'],
      rootDir: '.',
      outDir: 'out',
    },
  },
  null,
  2,
);
