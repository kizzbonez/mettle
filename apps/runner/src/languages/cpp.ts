import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import { CPP_PRELUDE } from './cpp-prelude';
import type { Harness, LanguageSpec } from './types';

/**
 * C++20 with warnings on, and with the address and undefined-behaviour
 * sanitizers: a use-after-free, an out-of-bounds read, a leak or a signed
 * overflow ends the test with a report instead of passing by luck.
 */
const GXX = [
  'g++ -std=c++20 -O1 -g1 -Wall -Wextra -pthread',
  '-fsanitize=address,undefined -fno-omit-frame-pointer',
  '-fdiagnostics-color=never -pipe',
  '-o lab main.cpp',
].join(' ');

/** Compile, then delete the harness so the hidden tests are not left on disk. */
const COMPILE = `${GXX}; code=$?; rm -f main.cpp; exit $code`;

function mainSource(request: RunnerRequest, nonce: string): string {
  const cases = request.tests.map((test, i) => `static void case_${i + 1}() {\n${test.code}\n}\n`);
  const arms = request.tests.map((_, i) => `        ${i === 0 ? 'if' : 'else if'} (name == "case_${i + 1}") case_${i + 1}();`);
  return [
    CPP_PRELUDE,
    ...cases,
    'int main(int argc, char** argv) {',
    '    const std::string name = argc > 1 ? argv[1] : "";',
    '    try {',
    ...arms,
    '        else return 2;',
    '    } catch (const mettle::Failure& failure) {',
    '        std::cerr << "FAIL: " << failure.message << std::endl;',
    '        return 1;',
    '    } catch (const std::exception& error) {',
    '        std::cerr << "FAIL: unexpected exception: " << error.what() << std::endl;',
    '        return 1;',
    '    } catch (...) {',
    '        std::cerr << "FAIL: unexpected exception" << std::endl;',
    '        return 1;',
    '    }',
    `    std::cout << "\\n${nonce}" << std::endl;`,
    '    return 0;',
    '}',
    '',
  ].join('\n');
}

/**
 * The learner's file is included into a generated `main.cpp`, so everything in
 * it is in scope; each test body becomes a function and runs as `./lab case_N`.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  return {
    files: [
      { path: 'solution.cpp', content: request.code },
      { path: 'main.cpp', content: mainSource(request, nonce) },
      ...request.fixtures,
    ],
    compile: ['sh', '-c', COMPILE],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['./lab', `case_${i + 1}`] })),
  };
}

export const cpp: LanguageSpec = {
  image: config.images.cpp,
  minMemoryMb: 768,
  pids: 128,
  build,
};
