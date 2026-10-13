import type { RunnerRequest } from '@mettle/shared';
import { config } from '../config';
import type { Harness, LanguageSpec } from './types';

/**
 * Loads the learner's file once, strictly: a YAML error stops the run with the
 * parser's own message, and so does a key written twice in one mapping, which
 * a plain load would accept by quietly keeping the last value.
 */
const LOADER = String.raw`"""Loads solution.yaml for the tests."""
import sys

import yaml

MERGE = 'tag:yaml.org,2002:merge'


class StrictLoader(yaml.SafeLoader):
    def construct_mapping(self, node, deep=False):
        seen = set()
        for key_node, _ in node.value:
            if key_node.tag == MERGE or not isinstance(key_node, yaml.ScalarNode):
                continue
            key = self.construct_object(key_node)
            if key in seen:
                raise yaml.constructor.ConstructorError(
                    None, None, f'the key {key!r} appears twice in the same mapping', key_node.start_mark)
            seen.add(key)
        return super().construct_mapping(node, deep)


def _load():
    with open('solution.yaml', encoding='utf-8') as handle:
        text = handle.read()
    try:
        return text, list(yaml.load_all(text, Loader=StrictLoader))
    except yaml.YAMLError as error:
        sys.exit(f'solution.yaml is not valid YAML.\n{error}')


RAW, docs = _load()
doc = docs[0] if docs else None


def at(value, path):
    """Follows a dotted path such as 'services.web.ports.0' and returns what is there."""
    for step in str(path).split('.'):
        if isinstance(value, list) and step.lstrip('-').isdigit() and -len(value) <= int(step) < len(value):
            value = value[int(step)]
        elif isinstance(value, dict) and step in value:
            value = value[step]
        else:
            raise AssertionError(f'nothing at {path!r}: stopped at {step!r}')
    return value
`;

function caseSource(body: string, nonce: string): string {
  return ['import yaml', 'from lab_yaml import RAW, at, doc, docs  # noqa: F401', '', body, '', `print("\\n${nonce}")`, ''].join('\n');
}

/**
 * The learner's file is `solution.yaml`. Each test body is a Python script
 * with the parsed file in scope: `doc` (the first document), `docs` (all of
 * them), `RAW` (the text) and `at(value, 'a.b.0')`.
 */
function build(request: RunnerRequest, nonce: string): Harness {
  const cases = request.tests.map((test, i) => ({
    path: `case_${i + 1}.py`,
    content: caseSource(test.code, nonce),
  }));
  return {
    files: [{ path: 'solution.yaml', content: request.code }, { path: 'lab_yaml.py', content: LOADER }, ...cases, ...request.fixtures],
    compile: ['python', 'lab_yaml.py'],
    tests: request.tests.map((test, i) => ({ id: test.id, cmd: ['python', `case_${i + 1}.py`] })),
  };
}

export const yaml: LanguageSpec = {
  image: config.images.yaml,
  minMemoryMb: 128,
  pids: 64,
  build,
};
