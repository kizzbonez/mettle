import { ConfigError, loadConfig, type Config } from "./solution.js";

function plain(config: Config): { host: string; port: number; maxLoadKg: number } {
  return { host: config.host, port: config.port, maxLoadKg: config.maxLoadKg };
}

function problemsOf(env: Record<string, string | undefined>, what: string): readonly string[] {
  const error = check.throws(() => loadConfig(env), `loadConfig refuses ${what}`, ConfigError);
  return (error as ConfigError).problems;
}

function variablesIn(problems: readonly string[]): string[] {
  return problems.map((problem) => problem.split(" ")[0] ?? "");
}

check.equal(
  plain(loadConfig({ KILN_HOST: " 0.0.0.0 ", KILN_PORT: " 9090 ", KILN_MAX_LOAD_KG: "72.5" })),
  { host: "0.0.0.0", port: 9090, maxLoadKg: 72.5 },
  "set variables are trimmed and parsed",
);
check.equal(plain(loadConfig({ KILN_PORT: "0" })).port, 0, "KILN_PORT may be 0, meaning any free port");
check.equal(plain(loadConfig({ KILN_PORT: "65535" })).port, 65535, "KILN_PORT may be 65535");
check.equal(plain(loadConfig({ KILN_MAX_LOAD_KG: "500" })).maxLoadKg, 500, "KILN_MAX_LOAD_KG may be 500");
check.equal(
  plain(loadConfig({ KILN_PORT: undefined, UNRELATED: "x" })),
  { host: "127.0.0.1", port: 8080, maxLoadKg: 60 },
  "variables that are not set, and unrelated ones, leave the defaults",
);
check.true(Object.isFrozen(loadConfig({})), "the configuration object is frozen");

for (const bad of ["", "eighty", "1e3", "80.5", "-1", "65536", "8 080"]) {
  check.equal(
    variablesIn(problemsOf({ KILN_PORT: bad }, `KILN_PORT="${bad}"`)),
    ["KILN_PORT"],
    `KILN_PORT="${bad}" is reported as one problem naming the variable`,
  );
}
for (const bad of ["", "0", "-5", "abc", "500.5", "1e2", "12kg"]) {
  check.equal(
    variablesIn(problemsOf({ KILN_MAX_LOAD_KG: bad }, `KILN_MAX_LOAD_KG="${bad}"`)),
    ["KILN_MAX_LOAD_KG"],
    `KILN_MAX_LOAD_KG="${bad}" is reported as one problem naming the variable`,
  );
}
check.equal(
  variablesIn(problemsOf({ KILN_HOST: "   " }, "a blank KILN_HOST")),
  ["KILN_HOST"],
  "a blank KILN_HOST is reported",
);
check.equal(
  variablesIn(problemsOf({ KILN_MAX_LOAD_KG: "lots", KILN_PORT: "http", KILN_HOST: "" }, "three bad variables")),
  ["KILN_HOST", "KILN_PORT", "KILN_MAX_LOAD_KG"],
  "every problem is reported at once, in the order host, port, load",
);
check.true(new ConfigError(["KILN_PORT x"]) instanceof Error, "ConfigError is an Error");

// Type checks only: this function is compiled, never called.
export function typesOnly(config: Config): void {
  // @ts-expect-error the configuration is read-only
  config.port = 1;
}
