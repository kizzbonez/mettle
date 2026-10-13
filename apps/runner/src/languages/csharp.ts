import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import { CSHARP_CHECKS, CSHARP_USINGS } from './csharp-prelude';
import type { Harness, LanguageSpec } from './types';

/**
 * `csc` in the sandbox image compiles against the reference assemblies with
 * nullable reference types on. Naming the entry point keeps the tests in
 * charge even if the learner's file has top-level statements, which would
 * otherwise become the program. The harness is deleted after compiling so the
 * hidden tests are not left on disk.
 */
const COMPILE = [
  'csc -main:MettleLab -out:lab.dll solution.cs usings.cs tests.cs',
  'code=$?',
  'rm -f tests.cs',
  '[ $code -eq 0 ] && cp /opt/dotnet-lab/lab.runtimeconfig.json lab.runtimeconfig.json',
  'exit $code',
].join('; ');

function testsSource(request: RunnerRequest, nonce: string): string {
  const cases = request.tests.map((test, i) => `    static async Task Case${i + 1}()\n    {\n${test.code}\n    }\n`);
  const arms = request.tests.map((_, i) => `                case "case_${i + 1}": Case${i + 1}().GetAwaiter().GetResult(); break;`);
  return [
    '#nullable enable',
    '#pragma warning disable CS1998 // a test body does not have to await',
    '',
    'static class MettleLab',
    '{',
    ...cases,
    '    static int Main(string[] args)',
    '    {',
    '        try',
    '        {',
    '            switch (args.Length > 0 ? args[0] : "")',
    '            {',
    ...arms,
    '                default: return 2;',
    '            }',
    '        }',
    '        catch (CheckFailed failure)',
    '        {',
    '            Console.Error.WriteLine("FAIL: " + failure.Message);',
    '            return 1;',
    '        }',
    '        catch (Exception error)',
    '        {',
    '            Console.Error.WriteLine($"FAIL: unexpected {error.GetType().Name}: {error.Message}");',
    '            return 1;',
    '        }',
    `        Console.Out.WriteLine("\\n${nonce}");`,
    '        return 0;',
    '    }',
    '}',
    '',
    CSHARP_CHECKS,
  ].join('\n');
}

/**
 * The learner's file is compiled together with a generated `tests.cs`; each
 * test body becomes an async method and runs as `dotnet lab.dll case_N`.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  return {
    files: [
      { path: 'solution.cs', content: request.code },
      { path: 'usings.cs', content: CSHARP_USINGS },
      { path: 'tests.cs', content: testsSource(request, nonce) },
      ...request.fixtures,
    ],
    compile: ['sh', '-c', COMPILE],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['dotnet', 'lab.dll', `case_${i + 1}`] })),
  };
}

export const csharp: LanguageSpec = {
  image: config.images.csharp,
  minMemoryMb: 512,
  pids: 128,
  build,
};
